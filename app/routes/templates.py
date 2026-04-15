"""
Template routes — plan-gated template listing and metadata.

GET /api/templates         → list all templates for the authenticated user's plan
GET /api/templates/{id}    → metadata for a single template (accessible regardless of lock)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.plans import (
    get_template,
    get_templates_for_plan,
    plan_from_string,
)
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()


@router.get("")
def list_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Return all active templates with a `locked` flag per the user's plan.
    Admin users receive all templates unlocked regardless of plan.
    """
    if getattr(current_user, "is_admin", False):
        # Admin: return everything unlocked, reported as the highest plan
        from app.core.plans import PlanTier, get_templates_for_plan
        templates = get_templates_for_plan(PlanTier.INTERVIEW_CRACKER)
        # Force all to unlocked regardless of supported_plans
        for t in templates:
            t["locked"] = False
        return {"plan": "interview_cracker", "templates": templates}

    plan = plan_from_string(getattr(current_user, "plan_tier", "starter"))
    templates = get_templates_for_plan(plan)
    return {"plan": plan.value, "templates": templates}


@router.get("/{template_id}")
def get_template_detail(
    template_id: str,
    current_user: User = Depends(get_current_user),
):
    """Return metadata for a single template, including lock status for this user."""
    tmpl = get_template(template_id)
    if not tmpl or not tmpl.get("active"):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template '{template_id}' not found.",
        )
    plan = plan_from_string(getattr(current_user, "plan_tier", "starter"))
    return {
        **tmpl,
        "locked": plan not in tmpl["supported_plans"],
        "supported_plans": [p.value for p in tmpl["supported_plans"]],
    }
