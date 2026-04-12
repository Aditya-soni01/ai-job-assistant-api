from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime


class ResumeOptimizeRequest(BaseModel):
    """Request schema for resume optimization."""
    resume_text: str = Field(
        ...,
        min_length=50,
        max_length=10000,
        description="Full resume text to optimize"
    )
    job_title: Optional[str] = Field(
        None,
        max_length=255,
        description="Target job title for optimization context"
    )
    job_description: Optional[str] = Field(
        None,
        max_length=5000,
        description="Target job description for alignment"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "resume_text": "I am a software engineer with 5 years of experience...",
            "job_title": "Senior Python Backend Engineer",
            "job_description": "Looking for an experienced Python developer..."
        }
    })


class ResumeOptimizeResponse(BaseModel):
    """Response schema for resume optimization."""
    optimized_resume: str = Field(
        ...,
        description="AI-optimized version of the resume"
    )
    improvements: List[str] = Field(
        ...,
        description="List of specific improvements made"
    )
    match_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Estimated match score with job (0-100)"
    )
    estimated_read_time: int = Field(
        ...,
        ge=0,
        description="Estimated read time in seconds"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of optimization"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "optimized_resume": "Senior Software Engineer with 5+ years of proven expertise...",
            "improvements": [
                "Added quantifiable metrics to achievements",
                "Reorganized experience to highlight relevant skills",
                "Enhanced technical keywords for ATS optimization"
            ],
            "match_score": 87.5,
            "estimated_read_time": 45,
            "timestamp": "2024-01-15T10:30:00"
        }
    })


class CoverLetterRequest(BaseModel):
    """Request schema for cover letter generation."""
    job_title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Target job title"
    )
    company_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Name of the company"
    )
    job_description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Full job description or requirements"
    )
    user_resume: str = Field(
        ...,
        min_length=50,
        max_length=10000,
        description="Candidate's resume or professional summary"
    )
    user_name: Optional[str] = Field(
        None,
        max_length=255,
        description="Candidate's name for personalization"
    )
    tone: Optional[str] = Field(
        "professional",
        pattern="^(professional|enthusiastic|formal|casual)$",
        description="Tone of the cover letter"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_title": "Senior Python Backend Engineer",
            "company_name": "TechCorp Solutions",
            "job_description": "Looking for an experienced Python developer to lead backend architecture...",
            "user_resume": "I am a software engineer with 5 years of experience...",
            "user_name": "John Doe",
            "tone": "professional"
        }
    })


class CoverLetterResponse(BaseModel):
    """Response schema for cover letter generation."""
    cover_letter: str = Field(
        ...,
        description="Generated cover letter text"
    )
    word_count: int = Field(
        ...,
        ge=0,
        description="Word count of generated cover letter"
    )
    key_highlights: List[str] = Field(
        ...,
        description="Key points highlighted in the cover letter"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of generation"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "cover_letter": "Dear Hiring Manager,\n\nI am excited to apply for the Senior Python Backend Engineer position...",
            "word_count": 287,
            "key_highlights": [
                "5+ years of Python and FastAPI experience",
                "Proven track record in microservices architecture",
                "Strong mentorship and team leadership skills"
            ],
            "timestamp": "2024-01-15T10:30:00"
        }
    })


class MatchScoreRequest(BaseModel):
    """Request schema for job-resume matching."""
    resume_text: str = Field(
        ...,
        min_length=50,
        max_length=10000,
        description="Candidate's resume text"
    )
    job_id: Optional[int] = Field(
        None,
        gt=0,
        description="Job ID for database lookup (alternative to job data)"
    )
    job_title: Optional[str] = Field(
        None,
        max_length=255,
        description="Job title (used if job_id not provided)"
    )
    job_description: Optional[str] = Field(
        None,
        max_length=5000,
        description="Job description (used if job_id not provided)"
    )
    required_skills: Optional[List[str]] = Field(
        None,
        description="List of required skills for the job"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "resume_text": "Senior Software Engineer with 5 years of experience in Python, FastAPI, and AWS...",
            "job_title": "Senior Python Backend Engineer",
            "job_description": "Looking for an experienced Python developer...",
            "required_skills": ["Python", "FastAPI", "PostgreSQL", "Docker"]
        }
    })


class MatchDetail(BaseModel):
    """Details of a matched skill or requirement."""
    item: str = Field(..., description="Skill or requirement name")
    status: str = Field(
        ...,
        pattern="^(matched|partial|missing)$",
        description="Match status: matched, partial, or missing"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Confidence level of match (0-100)"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "item": "Python",
            "status": "matched",
            "confidence": 95.0
        }
    })


class MatchScoreResponse(BaseModel):
    """Response schema for job-resume matching."""
    overall_match_score: float = Field(
        ...,
        ge=0.0,
        le=100.0,
        description="Overall match percentage (0-100)"
    )
    matched_skills: List[MatchDetail] = Field(
        ...,
        description="Details of matched skills"
    )
    missing_skills: List[MatchDetail] = Field(
        ...,
        description="Details of missing skills"
    )
    strengths: List[str] = Field(
        ...,
        description="Key strengths aligned with job requirements"
    )
    gaps: List[str] = Field(
        ...,
        description="Key experience or skill gaps"
    )
    recommendations: List[str] = Field(
        ...,
        description="Recommendations to improve match score"
    )
    match_category: str = Field(
        ...,
        pattern="^(excellent|strong|moderate|weak)$",
        description="Overall match category"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of analysis"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "overall_match_score": 82.5,
            "matched_skills": [
                {
                    "item": "Python",
                    "status": "matched",
                    "confidence": 98.0
                },
                {
                    "item": "FastAPI",
                    "status": "matched",
                    "confidence": 95.0
                }
            ],
            "missing_skills": [
                {
                    "item": "Kubernetes",
                    "status": "missing",
                    "confidence": 40.0
                }
            ],
            "strengths": [
                "Strong Python expertise",
                "Extensive backend development experience",
                "Good database optimization skills"
            ],
            "gaps": [
                "Limited Kubernetes experience",
                "No AWS certification mentioned"
            ],
            "recommendations": [
                "Add Kubernetes projects to portfolio",
                "Highlight any cloud infrastructure experience",
                "Consider AWS certification training"
            ],
            "match_category": "strong",
            "timestamp": "2024-01-15T10:30:00"
        }
    })


class InterviewPrepRequest(BaseModel):
    """Request schema for interview preparation."""
    job_title: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Target job title"
    )
    company_name: str = Field(
        ...,
        min_length=1,
        max_length=255,
        description="Company name"
    )
    job_description: Optional[str] = Field(
        None,
        max_length=5000,
        description="Job description for context"
    )
    user_experience: Optional[str] = Field(
        None,
        max_length=2000,
        description="Candidate's relevant experience summary"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "job_title": "Senior Python Backend Engineer",
            "company_name": "TechCorp Solutions",
            "job_description": "Looking for an experienced Python developer...",
            "user_experience": "5 years of backend development with Python and FastAPI..."
        }
    })


class InterviewQuestion(BaseModel):
    """A single interview question with context."""
    question: str = Field(..., description="Interview question")
    category: str = Field(
        ...,
        description="Category: technical, behavioral, situational, culture-fit"
    )
    difficulty: str = Field(
        ...,
        pattern="^(easy|medium|hard)$",
        description="Difficulty level"
    )
    tips: List[str] = Field(
        ...,
        description="Tips for answering the question"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "question": "How would you design a scalable microservices architecture?",
            "category": "technical",
            "difficulty": "hard",
            "tips": [
                "Discuss domain-driven design principles",
                "Mention API gateway patterns",
                "Talk about database per service pattern"
            ]
        }
    })


class InterviewPrepResponse(BaseModel):
    """Response schema for interview preparation."""
    interview_questions: List[InterviewQuestion] = Field(
        ...,
        description="Prepared interview questions"
    )
    conversation_tips: List[str] = Field(
        ...,
        description="General tips for the interview"
    )
    company_research_points: List[str] = Field(
        ...,
        description="Key points about the company to research"
    )
    potential_challenges: List[str] = Field(
        ...,
        description="Potential challenges or difficult topics to prepare for"
    )
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of preparation"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "interview_questions": [
                {
                    "question": "How would you design a scalable microservices architecture?",
                    "category": "technical",
                    "difficulty": "hard",
                    "tips": ["Discuss domain-driven design", "Mention API gateway patterns"]
                }
            ],
            "conversation_tips": [
                "Start with a brief introduction highlighting relevant experience",
                "Use STAR method for behavioral questions"
            ],
            "company_research_points": [
                "Recent funding rounds and growth trajectory",
                "Key products and services"
            ],
            "potential_challenges": [
                "Questions about lack of Kubernetes experience",
                "Behavioral questions about team conflicts"
            ],
            "timestamp": "2024-01-15T10:30:00"
        }
    })


class SectionImproveRequest(BaseModel):
    """Request schema for improving a specific resume section."""
    section: str = Field(..., description="Section name (e.g. professional_summary, experience_0)")
    current_text: str = Field(..., min_length=10, description="Current section text to improve")
    job_description: str = Field(..., min_length=20, description="Target job description for context")


class SectionImproveResponse(BaseModel):
    """Response schema for section improvement."""
    improved_text: str = Field(..., description="AI-improved section text")
    changes_made: List[str] = Field(default_factory=list, description="List of changes applied")


class AIErrorResponse(BaseModel):
    """Error response schema for AI operations."""
    detail: str = Field(..., description="Error message")
    code: str = Field(..., description="Error code")
    timestamp: datetime = Field(
        default_factory=datetime.utcnow,
        description="Timestamp of error"
    )

    model_config = ConfigDict(json_schema_extra={
        "example": {
            "detail": "Failed to process resume optimization",
            "code": "AI_PROCESSING_ERROR",
            "timestamp": "2024-01-15T10:30:00"
        }
    })