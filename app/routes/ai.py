from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status
import logging

from app.schemas.ai import (
    ResumeOptimizeRequest,
    ResumeOptimizeResponse,
    CoverLetterRequest,
    CoverLetterResponse,
    MatchScoreRequest,
    MatchScoreResponse,
    MatchDetail,
    SectionImproveRequest,
    SectionImproveResponse,
)
from app.services.ai_service import AIService
from app.services.auth_service import get_current_user
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# AIService reads ANTHROPIC_API_KEY from the environment automatically
ai_service = AIService(api_key="")


@router.post(
    "/optimize-resume",
    response_model=ResumeOptimizeResponse,
    summary="Optimize resume for a specific job",
)
def optimize_resume(
    request: ResumeOptimizeRequest,
    current_user: User = Depends(get_current_user),
) -> ResumeOptimizeResponse:
    """Optimize resume text for a specific job using AI analysis."""
    if not request.resume_text or len(request.resume_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must contain at least 50 characters",
        )

    try:
        result = ai_service.optimize_resume(
            resume_text=request.resume_text,
            target_job_title=request.job_title,
        )
    except Exception as e:
        logger.error(f"Resume optimization error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to optimize resume. Please try again later.",
        )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "AI service error"),
        )

    analysis = result.get("analysis", {})
    improvements: List[str] = (
        analysis.get("recommendations", []) or []
    )
    optimized_text: str = analysis.get("optimized_summary") or request.resume_text

    return ResumeOptimizeResponse(
        optimized_resume=optimized_text,
        improvements=improvements,
        match_score=0.0,
        estimated_read_time=max(1, len(optimized_text.split()) // 200),
    )


@router.post(
    "/cover-letter",
    response_model=CoverLetterResponse,
    summary="Generate a tailored cover letter",
)
def generate_cover_letter(
    request: CoverLetterRequest,
    current_user: User = Depends(get_current_user),
) -> CoverLetterResponse:
    """Generate a personalized cover letter for a specific job."""
    if not request.job_description or len(request.job_description.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description must contain at least 50 characters",
        )
    if not request.user_resume or len(request.user_resume.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must contain at least 50 characters",
        )

    try:
        result = ai_service.generate_cover_letter(
            resume_text=request.user_resume,
            job_title=request.job_title,
            company_name=request.company_name,
            job_description=request.job_description,
            user_name=request.user_name,
        )
    except Exception as e:
        logger.error(f"Cover letter generation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate cover letter. Please try again later.",
        )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "AI service error"),
        )

    cover_letter_text: str = result.get("cover_letter", "")
    key_highlights: List[str] = result.get("key_highlights", [])

    return CoverLetterResponse(
        cover_letter=cover_letter_text,
        word_count=len(cover_letter_text.split()),
        key_highlights=key_highlights,
    )


@router.post(
    "/match-score",
    response_model=MatchScoreResponse,
    summary="Calculate resume-job match score",
)
def calculate_match_score(
    request: MatchScoreRequest,
    current_user: User = Depends(get_current_user),
) -> MatchScoreResponse:
    """Calculate how well a resume matches a specific job listing."""
    if not request.job_description or len(request.job_description.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job description must contain at least 50 characters",
        )
    job_description = request.job_description
    job_title = request.job_title or "Unspecified Position"

    if not request.resume_text or len(request.resume_text.strip()) < 50:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Resume must contain at least 50 characters",
        )

    try:
        result = ai_service.score_job_match(
            resume_text=request.resume_text,
            job_title=job_title,
            job_description=job_description,
            required_skills=request.required_skills,
        )
    except Exception as e:
        logger.error(f"Match score calculation error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to calculate match score. Please try again later.",
        )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "AI service error"),
        )

    job_match = result.get("job_match", {})
    overall_score: float = float(job_match.get("overall_match_score", 0))

    matched_skills = [
        MatchDetail(item=s, status="matched", confidence=80.0)
        for s in (job_match.get("matched_skills") or [])
    ]
    missing_skills = [
        MatchDetail(item=s, status="missing", confidence=80.0)
        for s in (job_match.get("missing_skills") or [])
    ]

    if overall_score >= 85:
        category = "excellent"
    elif overall_score >= 70:
        category = "strong"
    elif overall_score >= 50:
        category = "moderate"
    else:
        category = "weak"

    return MatchScoreResponse(
        overall_match_score=overall_score,
        matched_skills=matched_skills,
        missing_skills=missing_skills,
        strengths=job_match.get("strengths_for_role") or [],
        gaps=job_match.get("improvement_areas") or [],
        recommendations=[job_match.get("summary", "")] if job_match.get("summary") else [],
        match_category=category,
    )


@router.post(
    "/improve-section",
    response_model=SectionImproveResponse,
    summary="Improve a specific resume section using AI",
)
def improve_section(
    request: SectionImproveRequest,
    current_user: User = Depends(get_current_user),
) -> SectionImproveResponse:
    """Rewrite a single resume section to better match the target job description."""
    try:
        result = ai_service.improve_section(
            section=request.section,
            current_text=request.current_text,
            job_description=request.job_description,
        )
    except Exception as e:
        logger.error(f"Section improvement error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to improve section. Please try again.",
        )

    if result.get("status") == "error":
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=result.get("message", "AI service error"),
        )

    return SectionImproveResponse(
        improved_text=result.get("improved_text", request.current_text),
        changes_made=result.get("changes_made", []),
    )
