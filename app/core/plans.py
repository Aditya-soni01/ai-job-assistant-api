"""
Plan definitions, template registry, and permission helpers for RoleGenie.

Single source of truth for:
- PlanTier enum (starter / job_seeker / interview_cracker)
- Template registry (10 templates with metadata)
- Access control helpers
"""

from enum import Enum
from typing import Any, Dict, List, Optional


class PlanTier(str, Enum):
    STARTER = "starter"
    JOB_SEEKER = "job_seeker"
    INTERVIEW_CRACKER = "interview_cracker"


# ─── Template Registry ────────────────────────────────────────────────────────
# Each entry is the canonical definition for one resume template.
# `supported_plans` lists the minimum plan and every plan above it.

TEMPLATE_REGISTRY: List[Dict[str, Any]] = [
    {
        "id": "template_1",
        "display_name": "Classic Professional",
        "internal_key": "Aditya_Soni_Resume",
        "category": "classic",
        "tags": ["ATS", "professional", "general"],
        "supported_plans": [PlanTier.STARTER, PlanTier.JOB_SEEKER, PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#1a56db",
        "description": "Clean classic layout with centered header and blue section dividers. Standard ATS-safe structure.",
        "sort_order": 1,
        "active": True,
    },
    {
        "id": "template_2",
        "display_name": "Compact ATS",
        "internal_key": "resume_aditya_soni",
        "category": "compact",
        "tags": ["ATS", "compact", "one-page", "teal"],
        "supported_plans": [PlanTier.JOB_SEEKER, PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#0f766e",
        "description": "Dense single-column with teal accents. Fits more content on one page without sacrificing readability.",
        "sort_order": 2,
        "active": True,
    },
    {
        "id": "template_3",
        "display_name": "Modern ATS Professional",
        "internal_key": "modern_ats_professional",
        "category": "modern",
        "tags": ["ATS", "modern", "tech", "backend", "fullstack", "violet"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#7c3aed",
        "description": "Contemporary design with left-aligned name, violet accents, and bold section headers.",
        "sort_order": 3,
        "active": True,
    },
    {
        "id": "template_4",
        "display_name": "Clean Minimal One-Column",
        "internal_key": "clean_minimal",
        "category": "minimal",
        "tags": ["minimal", "ATS", "clean", "slate"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#334155",
        "description": "Typography-first minimalist resume. Maximum whitespace, understated section markers, zero visual noise.",
        "sort_order": 4,
        "active": True,
    },
    {
        "id": "template_5",
        "display_name": "Technical Engineer",
        "internal_key": "technical_engineer",
        "category": "technical",
        "tags": ["ATS", "technical", "engineer", "backend", "software", "green"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#059669",
        "description": "Skills section promoted to top. Green-accented layout built for software and backend engineers.",
        "sort_order": 5,
        "active": True,
    },
    {
        "id": "template_6",
        "display_name": "Compact One-Page ATS",
        "internal_key": "compact_one_page",
        "category": "compact",
        "tags": ["ATS", "compact", "one-page", "dense", "blue"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#0369a1",
        "description": "Tightly spaced ATS-safe layout optimized to fit maximum professional history on one page.",
        "sort_order": 6,
        "active": True,
    },
    {
        "id": "template_7",
        "display_name": "Executive Professional",
        "internal_key": "executive_professional",
        "category": "executive",
        "tags": ["executive", "leadership", "corporate", "ATS", "dark"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#1e293b",
        "description": "Conservative, authoritative layout for senior and leadership positions. No-frills corporate styling.",
        "sort_order": 7,
        "active": True,
    },
    {
        "id": "template_8",
        "display_name": "Skills-First Hybrid",
        "internal_key": "skills_first_hybrid",
        "category": "hybrid",
        "tags": ["ATS", "skills", "hybrid", "tech", "cyan"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#0891b2",
        "description": "Skills section leads above experience. Great for career changers and tech specialists.",
        "sort_order": 8,
        "active": True,
    },
    {
        "id": "template_9",
        "display_name": "Project-Heavy Developer",
        "internal_key": "project_heavy_developer",
        "category": "technical",
        "tags": ["ATS", "projects", "developer", "portfolio", "rose"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#be185d",
        "description": "Projects elevated near the top. Ideal for developers and engineers with a strong project portfolio.",
        "sort_order": 9,
        "active": True,
    },
    {
        "id": "template_10",
        "display_name": "Elegant Corporate ATS",
        "internal_key": "elegant_corporate",
        "category": "corporate",
        "tags": ["ATS", "corporate", "elegant", "professional", "amber"],
        "supported_plans": [PlanTier.INTERVIEW_CRACKER],
        "accent_color": "#b45309",
        "description": "Refined amber-accented layout with subtle borders. Ideal for finance, consulting, and corporate roles.",
        "sort_order": 10,
        "active": True,
    },
]

# Fast lookup by template id
_TEMPLATE_MAP: Dict[str, Dict[str, Any]] = {t["id"]: t for t in TEMPLATE_REGISTRY}

# New slug IDs → legacy template_N keys
SLUG_ALIASES: Dict[str, str] = {
    "classic-professional":    "template_1",
    "compact-ats":             "template_2",
    "modern-ats-professional": "template_3",
    "clean-minimal":           "template_4",
    "technical-engineer":      "template_5",
    "compact-one-page":        "template_6",
    "executive-professional":  "template_7",
    "skills-first-hybrid":     "template_8",
    "project-heavy-developer": "template_9",
    "elegant-corporate":       "template_10",
}


def get_template(template_id: str) -> Optional[Dict[str, Any]]:
    """Return template metadata by id, or None if not found.
    Accepts both legacy 'template_N' IDs and new slug IDs."""
    resolved = SLUG_ALIASES.get(template_id, template_id)
    return _TEMPLATE_MAP.get(resolved)


def can_use_template(plan: PlanTier, template_id: str) -> bool:
    """Return True if the given plan is allowed to use this template.
    Accepts both legacy 'template_N' IDs and new slug IDs."""
    tmpl = get_template(template_id)
    if not tmpl or not tmpl.get("active"):
        return False
    return plan in tmpl["supported_plans"]


def get_templates_for_plan(plan: PlanTier) -> List[Dict[str, Any]]:
    """
    Return all active templates sorted by sort_order.
    Each entry includes a `locked` boolean: True when the plan cannot use it.
    `supported_plans` is serialized to plain strings for JSON compatibility.
    """
    result = []
    for tmpl in sorted(TEMPLATE_REGISTRY, key=lambda x: x["sort_order"]):
        if not tmpl.get("active"):
            continue
        entry = {
            **tmpl,
            "locked": plan not in tmpl["supported_plans"],
            "supported_plans": [p.value for p in tmpl["supported_plans"]],
        }
        result.append(entry)
    return result


def plan_from_string(plan_str: Optional[str]) -> PlanTier:
    """Convert a raw string (from DB) to PlanTier, defaulting to STARTER."""
    if not plan_str:
        return PlanTier.STARTER
    try:
        return PlanTier(plan_str)
    except ValueError:
        return PlanTier.STARTER


def required_plan_for_template(template_id: str) -> Optional[str]:
    """Return the display name of the lowest plan required for this template."""
    tmpl = get_template(template_id)
    if not tmpl:
        return None
    plans = tmpl.get("supported_plans", [])
    # Plans are ordered from lowest to highest in the registry
    tier_order = [PlanTier.STARTER, PlanTier.JOB_SEEKER, PlanTier.INTERVIEW_CRACKER]
    display = {
        PlanTier.STARTER: "Starter",
        PlanTier.JOB_SEEKER: "Job Seeker",
        PlanTier.INTERVIEW_CRACKER: "Interview Cracker",
    }
    for tier in tier_order:
        if tier in plans:
            return display[tier]
    return None
