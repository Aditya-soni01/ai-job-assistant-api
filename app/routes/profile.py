import io
import json
from typing import List

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
import logging

from app.core.database import get_db
from app.core.config import settings
from app.services.auth_service import get_current_user
from app.services.ai_service import AIService
from app.models.user import User
from app.models.profile import UserSkill, UserExperience, UserProject, UserEducation, UserCertification
from app.schemas.profile import (
    SkillCreate, SkillResponse,
    ExperienceCreate, ExperienceResponse,
    ProjectCreate, ProjectResponse,
    EducationCreate, EducationResponse,
    CertificationCreate, CertificationResponse,
    ProfileUpdate, FullProfileResponse,
)

logger = logging.getLogger(__name__)
router = APIRouter()
ai_service = AIService(api_key=settings.anthropic_api_key)

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5 MB


# ─── Completeness calculator ──────────────────────────────────────────────────

def calculate_completeness(user: User, db: Session) -> int:
    score = 0

    # Basic info (25 points)
    if user.first_name and user.last_name:
        score += 8
    if user.phone:
        score += 4
    if user.location:
        score += 4
    if user.linkedin_url:
        score += 5
    if user.professional_summary:
        score += 4

    # Skills (20 points)
    skill_count = db.query(UserSkill).filter(UserSkill.user_id == user.id).count()
    if skill_count >= 10:
        score += 20
    elif skill_count >= 5:
        score += 12
    elif skill_count > 0:
        score += 6

    # Experience (30 points)
    exp_count = db.query(UserExperience).filter(UserExperience.user_id == user.id).count()
    if exp_count >= 2:
        score += 20
    elif exp_count >= 1:
        score += 12
    project_count = db.query(UserProject).filter(
        UserProject.user_id == user.id,
        UserProject.experience_id.isnot(None)
    ).count()
    if project_count >= 2:
        score += 10
    elif project_count >= 1:
        score += 5

    # Education (15 points)
    edu_count = db.query(UserEducation).filter(UserEducation.user_id == user.id).count()
    if edu_count >= 1:
        score += 15

    # Certifications (10 points — optional bonus)
    cert_count = db.query(UserCertification).filter(UserCertification.user_id == user.id).count()
    if cert_count >= 1:
        score += 10

    return min(score, 100)


def _refresh_completeness(user: User, db: Session) -> None:
    user.profile_completeness = calculate_completeness(user, db)
    db.commit()


# ─── Text extraction helper (reused from resumes.py) ─────────────────────────

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


# ─── Full profile ─────────────────────────────────────────────────────────────

@router.get("", response_model=FullProfileResponse)
def get_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    skills = db.query(UserSkill).filter(UserSkill.user_id == current_user.id).all()
    experiences = (
        db.query(UserExperience)
        .filter(UserExperience.user_id == current_user.id)
        .order_by(UserExperience.order_index)
        .all()
    )
    exp_ids = [e.id for e in experiences]
    all_projects = db.query(UserProject).filter(UserProject.user_id == current_user.id).all()
    education = db.query(UserEducation).filter(UserEducation.user_id == current_user.id).all()
    certifications = db.query(UserCertification).filter(UserCertification.user_id == current_user.id).all()

    # Attach projects to their experiences
    proj_by_exp = {}
    standalone = []
    for p in all_projects:
        if p.experience_id and p.experience_id in exp_ids:
            proj_by_exp.setdefault(p.experience_id, []).append(p)
        else:
            standalone.append(p)

    exp_responses = []
    for exp in experiences:
        exp_data = ExperienceResponse.model_validate(exp)
        exp_data.projects = [ProjectResponse.model_validate(p) for p in proj_by_exp.get(exp.id, [])]
        exp_responses.append(exp_data)

    return FullProfileResponse(
        id=current_user.id,
        email=current_user.email,
        username=current_user.username,
        first_name=current_user.first_name,
        last_name=current_user.last_name,
        profile_headline=current_user.profile_headline,
        phone=current_user.phone,
        location=current_user.location,
        linkedin_url=current_user.linkedin_url,
        github_url=current_user.github_url,
        portfolio_url=current_user.portfolio_url,
        professional_summary=current_user.professional_summary,
        profile_completeness=current_user.profile_completeness or 0,
        is_profile_complete=current_user.is_profile_complete or False,
        skills=[SkillResponse.model_validate(s) for s in skills],
        experiences=exp_responses,
        education=[EducationResponse.model_validate(e) for e in education],
        certifications=[CertificationResponse.model_validate(c) for c in certifications],
        standalone_projects=[ProjectResponse.model_validate(p) for p in standalone],
    )


@router.put("", response_model=FullProfileResponse)
def update_profile(
    data: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(current_user, field, value)
    _refresh_completeness(current_user, db)
    return get_profile(db=db, current_user=current_user)


# ─── Skills ───────────────────────────────────────────────────────────────────

@router.post("/skills", response_model=SkillResponse, status_code=status.HTTP_201_CREATED)
def add_skill(
    skill: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_skill = UserSkill(user_id=current_user.id, **skill.model_dump())
    db.add(new_skill)
    db.commit()
    db.refresh(new_skill)
    _refresh_completeness(current_user, db)
    return new_skill


@router.put("/skills/{skill_id}", response_model=SkillResponse)
def update_skill(
    skill_id: int,
    skill: SkillCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserSkill).filter(UserSkill.id == skill_id, UserSkill.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Skill not found")
    for field, value in skill.model_dump().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/skills/{skill_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_skill(
    skill_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserSkill).filter(UserSkill.id == skill_id, UserSkill.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Skill not found")
    db.delete(obj)
    db.commit()
    _refresh_completeness(current_user, db)


# ─── Experiences ──────────────────────────────────────────────────────────────

@router.post("/experiences", response_model=ExperienceResponse, status_code=status.HTTP_201_CREATED)
def add_experience(
    exp: ExperienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_exp = UserExperience(user_id=current_user.id, **exp.model_dump())
    db.add(new_exp)
    db.commit()
    db.refresh(new_exp)
    _refresh_completeness(current_user, db)
    resp = ExperienceResponse.model_validate(new_exp)
    resp.projects = []
    return resp


@router.put("/experiences/{exp_id}", response_model=ExperienceResponse)
def update_experience(
    exp_id: int,
    exp: ExperienceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserExperience).filter(UserExperience.id == exp_id, UserExperience.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Experience not found")
    for field, value in exp.model_dump().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    projects = db.query(UserProject).filter(UserProject.experience_id == obj.id).all()
    resp = ExperienceResponse.model_validate(obj)
    resp.projects = [ProjectResponse.model_validate(p) for p in projects]
    return resp


@router.delete("/experiences/{exp_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_experience(
    exp_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserExperience).filter(UserExperience.id == exp_id, UserExperience.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Experience not found")
    db.delete(obj)
    db.commit()
    _refresh_completeness(current_user, db)


# ─── Projects ─────────────────────────────────────────────────────────────────

@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def add_project(
    proj: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Validate experience_id belongs to this user if provided
    if proj.experience_id:
        exp = db.query(UserExperience).filter(
            UserExperience.id == proj.experience_id,
            UserExperience.user_id == current_user.id,
        ).first()
        if not exp:
            raise HTTPException(status_code=404, detail="Experience not found")
    new_proj = UserProject(user_id=current_user.id, **proj.model_dump())
    db.add(new_proj)
    db.commit()
    db.refresh(new_proj)
    return new_proj


@router.put("/projects/{proj_id}", response_model=ProjectResponse)
def update_project(
    proj_id: int,
    proj: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserProject).filter(UserProject.id == proj_id, UserProject.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Project not found")
    for field, value in proj.model_dump().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/projects/{proj_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    proj_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserProject).filter(UserProject.id == proj_id, UserProject.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(obj)
    db.commit()


# ─── Education ────────────────────────────────────────────────────────────────

@router.post("/education", response_model=EducationResponse, status_code=status.HTTP_201_CREATED)
def add_education(
    edu: EducationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_edu = UserEducation(user_id=current_user.id, **edu.model_dump())
    db.add(new_edu)
    db.commit()
    db.refresh(new_edu)
    _refresh_completeness(current_user, db)
    return new_edu


@router.put("/education/{edu_id}", response_model=EducationResponse)
def update_education(
    edu_id: int,
    edu: EducationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserEducation).filter(UserEducation.id == edu_id, UserEducation.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Education not found")
    for field, value in edu.model_dump().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/education/{edu_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_education(
    edu_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserEducation).filter(UserEducation.id == edu_id, UserEducation.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Education not found")
    db.delete(obj)
    db.commit()
    _refresh_completeness(current_user, db)


# ─── Certifications ───────────────────────────────────────────────────────────

@router.post("/certifications", response_model=CertificationResponse, status_code=status.HTTP_201_CREATED)
def add_certification(
    cert: CertificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_cert = UserCertification(user_id=current_user.id, **cert.model_dump())
    db.add(new_cert)
    db.commit()
    db.refresh(new_cert)
    _refresh_completeness(current_user, db)
    return new_cert


@router.put("/certifications/{cert_id}", response_model=CertificationResponse)
def update_certification(
    cert_id: int,
    cert: CertificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserCertification).filter(UserCertification.id == cert_id, UserCertification.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Certification not found")
    for field, value in cert.model_dump().items():
        setattr(obj, field, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/certifications/{cert_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_certification(
    cert_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    obj = db.query(UserCertification).filter(UserCertification.id == cert_id, UserCertification.user_id == current_user.id).first()
    if not obj:
        raise HTTPException(status_code=404, detail="Certification not found")
    db.delete(obj)
    db.commit()
    _refresh_completeness(current_user, db)


# ─── Resume parse & import ────────────────────────────────────────────────────

@router.post("/parse-resume")
async def parse_resume_to_profile(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    content_bytes = await file.read()
    if len(content_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="File exceeds 5 MB limit")

    text = _extract_text(file.filename or "resume.txt", content_bytes)
    if len(text) < 20:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Extracted text is too short.")

    try:
        parsed = await ai_service.extract_profile_from_resume(text)
    except Exception as e:
        logger.error(f"Profile parse error: {e}")
        raise HTTPException(status_code=500, detail="AI failed to parse the resume. Please try again.")

    return {"status": "parsed", "data": parsed, "message": "Review and confirm before saving"}


@router.post("/import-parsed")
def import_parsed_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Save AI-parsed resume data into all profile tables."""

    # Update basic user fields
    for field in ("first_name", "last_name", "phone", "location", "linkedin_url",
                  "github_url", "portfolio_url", "professional_summary", "profile_headline"):
        value = data.get(field)
        if value:
            setattr(current_user, field, value)

    # Skills — clear existing and replace
    db.query(UserSkill).filter(UserSkill.user_id == current_user.id).delete()
    for skill_data in (data.get("skills") or []):
        if skill_data.get("name"):
            db.add(UserSkill(
                user_id=current_user.id,
                name=skill_data["name"],
                category=skill_data.get("category", "other"),
            ))

    # Experiences and their nested projects
    db.query(UserProject).filter(
        UserProject.user_id == current_user.id,
        UserProject.experience_id.isnot(None),
    ).delete()
    db.query(UserExperience).filter(UserExperience.user_id == current_user.id).delete()

    for i, exp_data in enumerate(data.get("experiences") or []):
        if not exp_data.get("job_title") or not exp_data.get("company"):
            continue
        exp = UserExperience(
            user_id=current_user.id,
            job_title=exp_data["job_title"],
            company=exp_data["company"],
            location=exp_data.get("location"),
            start_date=exp_data.get("start_date", ""),
            end_date=exp_data.get("end_date"),
            is_current=exp_data.get("is_current", False),
            description=exp_data.get("description"),
            order_index=i,
        )
        db.add(exp)
        db.flush()  # get exp.id

        for proj_data in (exp_data.get("projects") or []):
            if not proj_data.get("name"):
                continue
            db.add(UserProject(
                user_id=current_user.id,
                experience_id=exp.id,
                name=proj_data["name"],
                description=proj_data.get("description"),
                technologies=proj_data.get("technologies"),
                bullets=proj_data.get("bullets") or [],
            ))

    # Education
    db.query(UserEducation).filter(UserEducation.user_id == current_user.id).delete()
    for edu_data in (data.get("education") or []):
        if edu_data.get("degree") or edu_data.get("institution"):
            db.add(UserEducation(
                user_id=current_user.id,
                degree=edu_data.get("degree", ""),
                institution=edu_data.get("institution", ""),
                year=edu_data.get("year"),
                details=edu_data.get("details"),
            ))

    # Certifications
    db.query(UserCertification).filter(UserCertification.user_id == current_user.id).delete()
    for cert_data in (data.get("certifications") or []):
        if cert_data.get("name"):
            db.add(UserCertification(
                user_id=current_user.id,
                name=cert_data["name"],
                issuer=cert_data.get("issuer"),
                date=cert_data.get("date"),
            ))

    db.commit()
    _refresh_completeness(current_user, db)

    return {"status": "imported", "message": "Profile imported successfully"}


# ─── Completeness ─────────────────────────────────────────────────────────────

@router.get("/completeness")
def get_completeness(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    score = calculate_completeness(current_user, db)

    missing = []
    if not (current_user.first_name and current_user.last_name):
        missing.append("Full name")
    if not current_user.phone:
        missing.append("Phone number")
    if not current_user.location:
        missing.append("Location")
    if not current_user.linkedin_url:
        missing.append("LinkedIn URL")
    if not current_user.professional_summary:
        missing.append("Professional summary")
    if db.query(UserSkill).filter(UserSkill.user_id == current_user.id).count() < 5:
        missing.append("At least 5 skills")
    if db.query(UserExperience).filter(UserExperience.user_id == current_user.id).count() == 0:
        missing.append("Work experience")
    if db.query(UserEducation).filter(UserEducation.user_id == current_user.id).count() == 0:
        missing.append("Education")

    return {"score": score, "missing_sections": missing}
