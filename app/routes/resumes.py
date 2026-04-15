import io
import json
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.core.plans import can_use_template, plan_from_string, required_plan_for_template
from app.schemas.resume import ResumeResponse
from app.services.resume_service import ResumeService
from app.services.auth_service import get_current_user
from app.services.ai_service import AIService
from app.services import template_service
from app.models.user import User
from app.models.profile import UserSkill, UserExperience, UserProject, UserEducation, UserCertification
from app.core.config import settings
from app.utils.filename import build_resume_filename

logger = logging.getLogger(__name__)
router = APIRouter()
ai_service = AIService(api_key=settings.anthropic_api_key)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
DEFAULT_TEMPLATE = "template_1"


# ─── Text extraction ─────────────────────────────────────────────────────────

def _extract_text(filename: str, content_bytes: bytes) -> str:
    name = (filename or "").lower()

    if name.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(content_bytes))
            text = "\n".join(p.extract_text() or "" for p in reader.pages).strip()
            if len(text) >= 20:
                return text
        except Exception as e:
            logger.warning(f"pypdf extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from this PDF. Try a text-based PDF or a .txt file.",
        )

    if name.endswith(".docx"):
        try:
            from docx import Document
            doc = Document(io.BytesIO(content_bytes))
            text = "\n".join(p.text for p in doc.paragraphs if p.text.strip()).strip()
            if len(text) >= 20:
                return text
        except Exception as e:
            logger.warning(f"python-docx extraction failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Could not extract text from this DOCX file.",
        )

    for enc in ("utf-8", "utf-8-sig", "latin-1"):
        try:
            return content_bytes.decode(enc).strip()
        except UnicodeDecodeError:
            continue
    raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot decode file content.")


# ─── Data normalizer ──────────────────────────────────────────────────────────

def _normalize_data(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Convert either old flat format or new {analysis, optimized} format into canonical dict."""
    data: Dict[str, Any] = (
        raw.get("optimized", raw)
        if ("optimized" in raw and "analysis" in raw)
        else raw
    )

    contact = data.get("contact", "")
    if isinstance(contact, dict):
        parts = []
        for key in ("email", "phone", "location"):
            if contact.get(key):
                parts.append(contact[key])
        linkedin = contact.get("linkedin", "")
        portfolio = contact.get("portfolio", "")
        if linkedin:
            parts.append(f"LinkedIn: {linkedin}")
        if portfolio:
            parts.append(f"GitHub: {portfolio}")
        contact_str = " | ".join(parts)
    else:
        contact_str = str(contact)

    tech_skills = data.get("technical_skills") or data.get("skills") or []
    prof_skills = data.get("professional_skills") or []
    skills = tech_skills + prof_skills

    experience = []
    for exp in (data.get("experience") or []):
        sub_projects = exp.get("projects") or []
        if sub_projects:
            all_bullets = []
            for proj in sub_projects:
                all_bullets.extend(proj.get("bullets") or [])
            achievements = all_bullets
        else:
            achievements = exp.get("bullets") or exp.get("achievements") or []
        experience.append({
            "title": exp.get("title", ""),
            "company": exp.get("company", ""),
            "duration": exp.get("duration", ""),
            "achievements": achievements,
            "projects": sub_projects,
        })

    education = [
        {"degree": e.get("degree", ""), "institution": e.get("institution", ""), "year": e.get("year", "")}
        for e in (data.get("education") or [])
    ]

    projects = []
    for proj in (data.get("projects") or []):
        bullets = proj.get("bullets") or []
        desc = proj.get("description") or (bullets[0] if bullets else "")
        techs = proj.get("technologies", [])
        if isinstance(techs, str):
            techs = [t.strip() for t in techs.split(",") if t.strip()]
        projects.append({"name": proj.get("name", ""), "description": desc, "technologies": techs})

    return {
        "full_name": data.get("full_name", ""),
        "contact": contact_str,
        "summary": data.get("professional_summary") or data.get("summary", ""),
        "skills": skills,
        "technical_skills": tech_skills,
        "professional_skills": prof_skills,
        "experience": experience,
        "education": education,
        "projects": projects,
        "certifications": data.get("certifications") or [],
    }


# ─── Profile context builder ─────────────────────────────────────────────────

def build_profile_context(user: User, db: Session) -> dict:
    """Build structured profile data dict for AI context."""
    skills = db.query(UserSkill).filter(UserSkill.user_id == user.id).all()
    experiences = (
        db.query(UserExperience)
        .filter(UserExperience.user_id == user.id)
        .order_by(UserExperience.order_index)
        .all()
    )
    projects = db.query(UserProject).filter(UserProject.user_id == user.id).all()
    education = db.query(UserEducation).filter(UserEducation.user_id == user.id).all()
    certifications = db.query(UserCertification).filter(UserCertification.user_id == user.id).all()

    return {
        "name": f"{user.first_name or ''} {user.last_name or ''}".strip(),
        "email": user.email,
        "phone": user.phone,
        "location": user.location,
        "linkedin": user.linkedin_url,
        "github": user.github_url,
        "portfolio": user.portfolio_url,
        "headline": user.profile_headline,
        "summary": user.professional_summary,
        "skills": {
            "languages":   [s.name for s in skills if s.category == "language"],
            "frameworks":  [s.name for s in skills if s.category == "framework"],
            "databases":   [s.name for s in skills if s.category == "database"],
            "tools":       [s.name for s in skills if s.category == "tool"],
            "cloud":       [s.name for s in skills if s.category == "cloud"],
            "soft_skills": [s.name for s in skills if s.category == "soft_skill"],
        },
        "experiences": [
            {
                "title": exp.job_title,
                "company": exp.company,
                "location": exp.location,
                "start_date": exp.start_date,
                "end_date": exp.end_date or "Present",
                "is_current": exp.is_current,
                "description": exp.description,
                "projects": [
                    {
                        "name": p.name,
                        "description": p.description,
                        "technologies": p.technologies,
                        "bullets": p.bullets or [],
                    }
                    for p in projects if p.experience_id == exp.id
                ],
            }
            for exp in experiences
        ],
        "education": [
            {"degree": e.degree, "institution": e.institution, "year": e.year, "details": e.details}
            for e in education
        ],
        "certifications": [
            {"name": c.name, "issuer": c.issuer, "date": c.date}
            for c in certifications
        ],
        "standalone_projects": [
            {"name": p.name, "description": p.description, "technologies": p.technologies, "bullets": p.bullets or []}
            for p in projects if p.experience_id is None
        ],
    }


def _profile_has_content(profile_data: dict) -> bool:
    """Return True if the profile has enough data to serve as the AI source of truth."""
    has_experience = len(profile_data.get("experiences", [])) > 0
    skills = profile_data.get("skills", {})
    total_skills = sum(len(v) for v in skills.values())
    return has_experience or total_skills >= 3


# ─── Plan + template guard ────────────────────────────────────────────────────

def _assert_template_access(user: User, template_id: str) -> None:
    """Raise 403 if the user's plan does not allow this template.
    Admin users bypass all plan restrictions."""
    if getattr(user, "is_admin", False):
        return
    plan = plan_from_string(getattr(user, "plan_tier", "starter"))
    if not can_use_template(plan, template_id):
        required = required_plan_for_template(template_id) or "a higher plan"
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                f"Your current plan ({plan.value}) does not include template '{template_id}'. "
                f"Upgrade to {required} to use this template."
            ),
        )


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("", response_model=List[ResumeResponse])
def list_resumes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return ResumeService.get_user_resumes(db, current_user.id)


@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_201_CREATED)
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content_bytes = await file.read()
    if len(content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds 5 MB limit",
        )

    text = _extract_text(file.filename or "resume.txt", content_bytes)
    if len(text) < 20:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Extracted text is too short. Ensure the file has readable text.",
        )

    resume = ResumeService.create_resume(db, current_user.id, file.filename or "resume", text)
    logger.info(f"User {current_user.id} uploaded resume {resume.id} ({len(text)} chars)")
    return resume


@router.post("/{resume_id}/optimize")
def optimize_resume(
    resume_id: int,
    job_description: Optional[str] = Query(default=None),
    job_title: Optional[str] = Query(default=None),
    company: Optional[str] = Query(default=None),
    tone: Optional[str] = Query(default=None),
    template_id: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = ResumeService.get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    # Validate template access
    tid = template_id or DEFAULT_TEMPLATE
    _assert_template_access(current_user, tid)

    jd_text = job_description or ""
    if not jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A job description is required.",
        )

    resolved_title = job_title or "Target Role"
    resolved_company = company or ""

    # Load profile — use as source of truth if it has content
    profile_data = build_profile_context(current_user, db)
    use_profile = _profile_has_content(profile_data)

    try:
        if use_profile:
            analysis = ai_service.analyze_resume_job_fit_v2(
                profile_data=profile_data,
                resume_text=resume.original_content,
                job_title=resolved_title,
                company_name=resolved_company,
                job_description=jd_text,
            )
            optimized = ai_service.generate_optimized_resume_v2(
                profile_data=profile_data,
                resume_text=resume.original_content,
                analysis=analysis,
                job_title=resolved_title,
                company_name=resolved_company,
                job_description=jd_text,
                tone=tone or (current_user.preferences or {}).get("resume_tone", "professional"),
            )
        else:
            # Fallback: no profile data yet — use raw resume text only
            analysis = ai_service.analyze_resume_job_fit(
                resume_text=resume.original_content,
                job_title=resolved_title,
                company_name=resolved_company,
                job_description=jd_text,
                required_skills="",
            )
            optimized = ai_service.generate_optimized_resume(
                resume_text=resume.original_content,
                analysis=analysis,
                job_title=resolved_title,
                company_name=resolved_company,
                job_description=jd_text,
            )
    except Exception as e:
        logger.error(f"AI optimization error: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI optimization failed. Please check your API key and try again.",
        )

    result = {"analysis": analysis, "optimized": optimized, "template_id": tid}
    ResumeService.update_optimized(db, resume, json.dumps(result, ensure_ascii=False))

    return {"status": "success", "data": result}


@router.get("/{resume_id}/download/docx")
def download_docx(
    resume_id: int,
    template_id: Optional[str] = Query(default=None),
    job_title: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = ResumeService.get_resume(db, resume_id, current_user.id)
    if not resume or not resume.optimized_content:
        raise HTTPException(status_code=404, detail="No optimized resume found")

    try:
        raw = json.loads(resume.optimized_content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Optimized content is not valid JSON")

    # Resolve template_id — prefer query param, then stored value, then default
    tid = template_id or raw.get("template_id") or DEFAULT_TEMPLATE
    _assert_template_access(current_user, tid)

    data = _normalize_data(raw)

    try:
        docx_bytes = template_service.build_docx(tid, data)
    except Exception as e:
        logger.error(f"DOCX generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate DOCX file")

    # Derive job title from stored data if not provided
    resolved_title = job_title or raw.get("optimized", {}).get("job_title") or ""
    user_name = data.get("full_name") or f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
    filename = build_resume_filename(user_name or None, resolved_title or None, "docx")

    return StreamingResponse(
        io.BytesIO(docx_bytes),
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(docx_bytes)),
        },
    )


@router.get("/{resume_id}/download/pdf")
def download_pdf(
    resume_id: int,
    template_id: Optional[str] = Query(default=None),
    job_title: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = ResumeService.get_resume(db, resume_id, current_user.id)
    if not resume or not resume.optimized_content:
        raise HTTPException(status_code=404, detail="No optimized resume found")

    try:
        raw = json.loads(resume.optimized_content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=422, detail="Optimized content is not valid JSON")

    tid = template_id or raw.get("template_id") or DEFAULT_TEMPLATE
    _assert_template_access(current_user, tid)

    data = _normalize_data(raw)

    try:
        pdf_bytes = template_service.build_pdf(tid, data)
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF file")

    resolved_title = job_title or raw.get("optimized", {}).get("job_title") or ""
    user_name = data.get("full_name") or f"{current_user.first_name or ''} {current_user.last_name or ''}".strip()
    filename = build_resume_filename(user_name or None, resolved_title or None, "pdf")

    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )


@router.delete("/{resume_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resume(
    resume_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = ResumeService.get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    ResumeService.delete_resume(db, resume)
