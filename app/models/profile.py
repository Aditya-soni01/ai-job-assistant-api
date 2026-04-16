from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, ForeignKey
from app.core.database import Base


class UserSkill(Base):
    __tablename__ = "user_skills"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(50), nullable=False)
    # "language", "framework", "database", "tool", "cloud", "soft_skill", "other"
    proficiency = Column(String(20), nullable=True)
    # "expert", "proficient", "familiar" — internal only, NEVER shown on resume


class UserExperience(Base):
    __tablename__ = "user_experiences"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_title = Column(String(200), nullable=False)
    company = Column(String(200), nullable=False)
    location = Column(String(100), nullable=True)
    start_date = Column(String(20), nullable=False)  # "Jun 2025"
    end_date = Column(String(20), nullable=True)      # null = "Present"
    is_current = Column(Boolean, default=False)
    description = Column(Text, nullable=True)
    order_index = Column(Integer, default=0)


class UserProject(Base):
    __tablename__ = "user_projects"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    experience_id = Column(Integer, ForeignKey("user_experiences.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    technologies = Column(String(500), nullable=True)  # comma-separated
    bullets = Column(JSON, nullable=True)               # ["achievement 1", "achievement 2"]


class UserEducation(Base):
    __tablename__ = "user_education"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    degree = Column(String(200), nullable=False)
    institution = Column(String(200), nullable=False)
    year = Column(String(20), nullable=True)   # "2015 – 2019"
    details = Column(Text, nullable=True)


class UserCertification(Base):
    __tablename__ = "user_certifications"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(300), nullable=False)
    issuer = Column(String(200), nullable=True)
    date = Column(String(20), nullable=True)
    credential_url = Column(String(500), nullable=True)
