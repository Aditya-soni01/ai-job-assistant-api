import io
import json
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.schemas.resume import ResumeResponse
from app.services.resume_service import ResumeService
from app.services.auth_service import get_current_user
from app.services.ai_service import AIService
from app.models.user import User
from app.core.config import settings

logger = logging.getLogger(__name__)
router = APIRouter()
ai_service = AIService(api_key=settings.anthropic_api_key)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


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


# ─── File generators ──────────────────────────────────────────────────────────

def _build_docx(data: Dict[str, Any]) -> bytes:
    from docx import Document
    from docx.shared import Pt, Inches, RGBColor
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.oxml.ns import qn
    from docx.oxml import OxmlElement

    doc = Document()
    sec = doc.sections[0]
    sec.top_margin = Inches(0.75)
    sec.bottom_margin = Inches(0.75)
    sec.left_margin = Inches(1.0)
    sec.right_margin = Inches(1.0)

    # Remove default paragraph spacing
    doc.styles["Normal"].paragraph_format.space_after = Pt(0)

    def _add_hr(paragraph):
        """Add a bottom border to a paragraph."""
        pPr = paragraph._element.get_or_add_pPr()
        pBdr = OxmlElement("w:pBdr")
        bottom = OxmlElement("w:bottom")
        bottom.set(qn("w:val"), "single")
        bottom.set(qn("w:sz"), "6")
        bottom.set(qn("w:space"), "1")
        bottom.set(qn("w:color"), "1a56db")
        pBdr.append(bottom)
        pPr.append(pBdr)

    def add_heading(title: str):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(10)
        run = p.add_run(title.upper())
        run.bold = True
        run.font.size = Pt(11)
        run.font.color.rgb = RGBColor(0x1A, 0x56, 0xDB)
        _add_hr(p)
        return p

    # Name
    p_name = doc.add_paragraph()
    p_name.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p_name.add_run(data.get("full_name", ""))
    r.bold = True
    r.font.size = Pt(22)

    # Contact
    p_contact = doc.add_paragraph()
    p_contact.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_contact.add_run(data.get("contact", "")).font.size = Pt(10)

    # Summary
    if data.get("summary"):
        add_heading("Professional Summary")
        p = doc.add_paragraph(data["summary"])
        p.runs[0].font.size = Pt(10)

    # Skills
    if data.get("skills"):
        add_heading("Skills")
        p = doc.add_paragraph(" • ".join(data["skills"]))
        p.runs[0].font.size = Pt(10)

    # Experience
    if data.get("experience"):
        add_heading("Experience")
        for exp in data["experience"]:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(6)
            r = p.add_run(f"{exp.get('title', '')}  —  {exp.get('company', '')}")
            r.bold = True
            r.font.size = Pt(10)
            p2 = doc.add_paragraph()
            r2 = p2.add_run(exp.get("duration", ""))
            r2.italic = True
            r2.font.size = Pt(9)
            for ach in exp.get("achievements", []):
                bp = doc.add_paragraph(style="List Bullet")
                bp.add_run(ach).font.size = Pt(10)

    # Education
    if data.get("education"):
        add_heading("Education")
        for edu in data["education"]:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            r = p.add_run(edu.get("degree", ""))
            r.bold = True
            r.font.size = Pt(10)
            doc.add_paragraph(f"{edu.get('institution', '')} | {edu.get('year', '')}").runs[0].font.size = Pt(10)

    # Projects
    if data.get("projects"):
        add_heading("Projects")
        for proj in data["projects"]:
            p = doc.add_paragraph()
            p.paragraph_format.space_before = Pt(4)
            r = p.add_run(proj.get("name", ""))
            r.bold = True
            r.font.size = Pt(10)
            doc.add_paragraph(proj.get("description", "")).runs[0].font.size = Pt(10)
            techs = proj.get("technologies", [])
            if techs:
                p3 = doc.add_paragraph(f"Technologies: {', '.join(techs)}")
                p3.runs[0].italic = True
                p3.runs[0].font.size = Pt(9)

    # Certifications
    if data.get("certifications"):
        add_heading("Certifications")
        for cert in data["certifications"]:
            bp = doc.add_paragraph(style="List Bullet")
            bp.add_run(cert).font.size = Pt(10)

    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def _build_pdf(data: Dict[str, Any]) -> bytes:
    from reportlab.lib.pagesizes import letter
    from reportlab.lib.styles import ParagraphStyle
    from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, HRFlowable
    from reportlab.lib.units import inch
    from reportlab.lib import colors

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=letter,
        rightMargin=inch,
        leftMargin=inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    BLUE = colors.HexColor("#1a56db")
    GRAY = colors.HexColor("#64748b")
    LIGHT = colors.HexColor("#e2e8f0")

    name_style = ParagraphStyle("Name", fontSize=22, fontName="Helvetica-Bold", alignment=1, spaceAfter=4)
    contact_style = ParagraphStyle("Contact", fontSize=10, alignment=1, textColor=GRAY, spaceAfter=10)
    section_style = ParagraphStyle("Section", fontSize=11, fontName="Helvetica-Bold", textColor=BLUE, spaceBefore=10, spaceAfter=3)
    body_style = ParagraphStyle("Body", fontSize=10, leading=14, spaceAfter=4)
    bullet_style = ParagraphStyle("Bullet", fontSize=10, leading=14, leftIndent=16, spaceAfter=2)
    job_title_style = ParagraphStyle("JobTitle", fontSize=10, fontName="Helvetica-Bold", spaceAfter=1)
    italic_style = ParagraphStyle("Italic", fontSize=9, fontName="Helvetica-Oblique", textColor=GRAY, spaceAfter=3)

    story = []
    story.append(Paragraph(data.get("full_name", ""), name_style))
    story.append(Paragraph(data.get("contact", ""), contact_style))
    story.append(HRFlowable(width="100%", thickness=1.5, color=BLUE, spaceAfter=4))

    def section(title: str):
        story.append(Paragraph(title.upper(), section_style))
        story.append(HRFlowable(width="100%", thickness=0.5, color=LIGHT, spaceAfter=4))

    if data.get("summary"):
        section("Professional Summary")
        story.append(Paragraph(data["summary"], body_style))

    if data.get("skills"):
        section("Skills")
        story.append(Paragraph(" &bull; ".join(data["skills"]), body_style))

    if data.get("experience"):
        section("Experience")
        for exp in data["experience"]:
            story.append(Paragraph(f"<b>{exp.get('title','')} — {exp.get('company','')}</b>", job_title_style))
            story.append(Paragraph(f"<i>{exp.get('duration','')}</i>", italic_style))
            for ach in exp.get("achievements", []):
                story.append(Paragraph(f"&bull; {ach}", bullet_style))
            story.append(Spacer(1, 4))

    if data.get("education"):
        section("Education")
        for edu in data["education"]:
            story.append(Paragraph(f"<b>{edu.get('degree','')}</b>", job_title_style))
            story.append(Paragraph(f"{edu.get('institution','')} | {edu.get('year','')}", body_style))

    if data.get("projects"):
        section("Projects")
        for proj in data["projects"]:
            story.append(Paragraph(f"<b>{proj.get('name','')}</b>", job_title_style))
            story.append(Paragraph(proj.get("description", ""), body_style))
            techs = proj.get("technologies", [])
            if techs:
                story.append(Paragraph(f"<i>Technologies: {', '.join(techs)}</i>", italic_style))

    if data.get("certifications"):
        section("Certifications")
        for cert in data["certifications"]:
            story.append(Paragraph(f"&bull; {cert}", bullet_style))

    doc.build(story)
    return buf.getvalue()


# ─── Data normalizer (handles old flat format and new {analysis, optimized} format) ──

def _normalize_data(raw: Dict[str, Any]) -> Dict[str, Any]:
    """Convert either old or new optimized-content JSON into a canonical dict for the builders."""
    data: Dict[str, Any] = raw.get("optimized", raw) if ("optimized" in raw and "analysis" in raw) else raw

    contact = data.get("contact", "")
    if isinstance(contact, dict):
        parts = [v for v in [contact.get("email"), contact.get("phone"), contact.get("location")] if v]
        contact_str = " | ".join(parts)
    else:
        contact_str = str(contact)

    tech = data.get("technical_skills") or data.get("skills") or []
    prof = data.get("professional_skills") or []
    skills = tech + prof

    experience = []
    for exp in (data.get("experience") or []):
        experience.append({
            "title": exp.get("title", ""),
            "company": exp.get("company", ""),
            "duration": exp.get("duration", ""),
            "achievements": exp.get("bullets") or exp.get("achievements") or [],
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
        "experience": experience,
        "education": education,
        "projects": projects,
        "certifications": data.get("certifications") or [],
    }


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
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 5 MB limit")

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
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    resume = ResumeService.get_resume(db, resume_id, current_user.id)
    if not resume:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resume not found")

    jd_text = job_description or ""
    job_title = "Target Role"
    company_name = ""
    required_skills = ""

    if not jd_text.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A job description is required. Select a job or paste a description.",
        )

    try:
        # Stage 1 — Analysis
        analysis = ai_service.analyze_resume_job_fit(
            resume_text=resume.original_content,
            job_title=job_title,
            company_name=company_name,
            job_description=jd_text,
            required_skills=required_skills,
        )
        # Stage 2 — Optimized rewrite
        optimized = ai_service.generate_optimized_resume(
            resume_text=resume.original_content,
            analysis=analysis,
            job_title=job_title,
            company_name=company_name,
            job_description=jd_text,
        )
    except Exception as e:
        logger.error(f"AI optimization error: {e}")
        raise HTTPException(status_code=500, detail="AI optimization failed. Please check your API key and try again.")

    result = {"analysis": analysis, "optimized": optimized}
    ResumeService.update_optimized(db, resume, json.dumps(result, ensure_ascii=False))

    return {"status": "success", "data": result}


@router.get("/{resume_id}/download/docx")
def download_docx(
    resume_id: int,
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

    data = _normalize_data(raw)

    try:
        docx_bytes = _build_docx(data)
    except Exception as e:
        logger.error(f"DOCX generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate DOCX file")

    candidate = (data.get("full_name") or "").strip().replace(" ", "_")
    filename = f"{candidate or resume.file_name.rsplit('.', 1)[0]}_Resume_Optimized.docx"

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

    data = _normalize_data(raw)

    try:
        pdf_bytes = _build_pdf(data)
    except Exception as e:
        logger.error(f"PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to generate PDF file")

    candidate = (data.get("full_name") or "").strip().replace(" ", "_")
    filename = f"{candidate or resume.file_name.rsplit('.', 1)[0]}_Resume_Optimized.pdf"

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
