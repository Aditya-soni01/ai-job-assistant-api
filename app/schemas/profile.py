from pydantic import BaseModel
from typing import Optional, List


class SkillCreate(BaseModel):
    name: str
    category: str  # "language", "framework", "database", "tool", "cloud", "soft_skill", "other"


class SkillResponse(SkillCreate):
    id: int

    class Config:
        from_attributes = True


class ExperienceCreate(BaseModel):
    job_title: str
    company: str
    location: Optional[str] = None
    start_date: str
    end_date: Optional[str] = None
    is_current: bool = False
    description: Optional[str] = None


class ExperienceResponse(ExperienceCreate):
    id: int
    projects: List["ProjectResponse"] = []

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    experience_id: Optional[int] = None
    name: str
    description: Optional[str] = None
    technologies: Optional[str] = None
    bullets: Optional[List[str]] = None


class ProjectResponse(ProjectCreate):
    id: int

    class Config:
        from_attributes = True


class EducationCreate(BaseModel):
    degree: str
    institution: str
    year: Optional[str] = None
    details: Optional[str] = None


class EducationResponse(EducationCreate):
    id: int

    class Config:
        from_attributes = True


class CertificationCreate(BaseModel):
    name: str
    issuer: Optional[str] = None
    date: Optional[str] = None
    credential_url: Optional[str] = None


class CertificationResponse(CertificationCreate):
    id: int

    class Config:
        from_attributes = True


class ProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profile_headline: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin_url: Optional[str] = None
    github_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    professional_summary: Optional[str] = None
    is_profile_complete: Optional[bool] = None


class FullProfileResponse(BaseModel):
    id: int
    email: str
    username: str
    first_name: Optional[str]
    last_name: Optional[str]
    profile_headline: Optional[str]
    phone: Optional[str]
    location: Optional[str]
    linkedin_url: Optional[str]
    github_url: Optional[str]
    portfolio_url: Optional[str]
    professional_summary: Optional[str]
    profile_completeness: int
    is_profile_complete: bool
    skills: List[SkillResponse]
    experiences: List[ExperienceResponse]
    education: List[EducationResponse]
    certifications: List[CertificationResponse]
    standalone_projects: List[ProjectResponse]

    class Config:
        from_attributes = True


# Update forward references
ExperienceResponse.model_rebuild()
