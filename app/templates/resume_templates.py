"""
Resume template configuration — Python source of truth for PDF/DOCX generation.

Each entry maps a slug ID to the style parameters consumed by template_service.py.
This module is consumed by build utilities and can be extended for richer
per-template customisation (e.g., two-column layouts) in the future.

Current generation is handled by template_service.build_pdf / build_docx
via the _SLUG_ALIASES dispatch table. This file documents the intent of each
template so the two sources stay in sync.
"""

from typing import Any, Dict, List

TEMPLATES: Dict[str, Dict[str, Any]] = {
    "classic-professional": {
        "layout": "single-column",
        "legacy_id": "template_1",
        "colors": {
            "primary": "#1a5276",
            "secondary": "#2e86c1",
            "header_bg": "#ffffff",
            "header_text": "#1a5276",
            "body_text": "#2c3e50",
            "muted_text": "#7f8c8d",
            "section_border": "#1a5276",
            "skill_pill_bg": "#eaf2f8",
            "skill_pill_text": "#1a5276",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 22,
            "section_size": 13,
            "body_size": 10,
            "font": "Helvetica",
            "heading_style": "uppercase",
            "name_align": "center",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": False,
            "skills_position": "after-summary",
            "projects_position": "after-experience",
            "compact": False,
        },
    },
    "compact-ats": {
        "layout": "single-column",
        "legacy_id": "template_2",
        "colors": {
            "primary": "#0e8a7d",
            "secondary": "#14b8a6",
            "header_bg": "#ffffff",
            "header_text": "#0e8a7d",
            "body_text": "#1f2937",
            "muted_text": "#6b7280",
            "section_border": "#0e8a7d",
            "skill_pill_bg": "#f0fdfa",
            "skill_pill_text": "#0e8a7d",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 20,
            "section_size": 11,
            "body_size": 9.5,
            "font": "Helvetica",
            "heading_style": "bold-only",
            "name_align": "center",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": True,
            "skills_position": "after-summary",
            "projects_position": "after-experience",
            "compact": True,
        },
    },
    "modern-ats-professional": {
        "layout": "single-column",
        "legacy_id": "template_3",
        "colors": {
            "primary": "#6c3483",
            "secondary": "#a569bd",
            "header_bg": "#ffffff",
            "header_text": "#6c3483",
            "body_text": "#2c3e50",
            "muted_text": "#7f8c8d",
            "section_border": "#6c3483",
            "skill_pill_bg": "#f4ecf7",
            "skill_pill_text": "#6c3483",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 24,
            "section_size": 13,
            "body_size": 10,
            "font": "Helvetica",
            "heading_style": "uppercase",
            "name_align": "left",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": False,
            "skills_position": "after-summary",
            "projects_position": "after-experience",
            "compact": False,
        },
    },
    "clean-minimal": {
        "layout": "single-column",
        "legacy_id": "template_4",
        "colors": {
            "primary": "#374151",
            "secondary": "#9ca3af",
            "header_bg": "#ffffff",
            "header_text": "#111827",
            "body_text": "#374151",
            "muted_text": "#9ca3af",
            "section_border": "#e5e7eb",
            "skill_pill_bg": "#f3f4f6",
            "skill_pill_text": "#374151",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 26,
            "section_size": 11,
            "body_size": 10,
            "font": "Times-Roman",
            "heading_style": "titlecase",
            "name_align": "center",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": False,
            "skills_position": "bottom",
            "projects_position": "after-experience",
            "compact": False,
        },
    },
    "technical-engineer": {
        "layout": "single-column",
        "legacy_id": "template_5",
        "colors": {
            "primary": "#166534",
            "secondary": "#22c55e",
            "header_bg": "#ffffff",
            "header_text": "#166534",
            "body_text": "#1f2937",
            "muted_text": "#6b7280",
            "section_border": "#166534",
            "skill_pill_bg": "#f0fdf4",
            "skill_pill_text": "#166534",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 20,
            "section_size": 12,
            "body_size": 10,
            "font": "Helvetica",
            "heading_style": "uppercase",
            "name_align": "center",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": True,
            "skills_position": "top",
            "projects_position": "after-experience",
            "compact": False,
        },
    },
    "compact-one-page": {
        "layout": "single-column",
        "legacy_id": "template_6",
        "colors": {
            "primary": "#1e40af",
            "secondary": "#3b82f6",
            "header_bg": "#ffffff",
            "header_text": "#1e40af",
            "body_text": "#1f2937",
            "muted_text": "#6b7280",
            "section_border": "#1e40af",
            "skill_pill_bg": "#eff6ff",
            "skill_pill_text": "#1e40af",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 18,
            "section_size": 11,
            "body_size": 9,
            "font": "Helvetica",
            "heading_style": "bold-only",
            "name_align": "center",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": False,
            "skills_position": "after-summary",
            "projects_position": "after-experience",
            "compact": True,
        },
    },
    "executive-professional": {
        "layout": "single-column",
        "legacy_id": "template_7",
        "colors": {
            "primary": "#1f2937",
            "secondary": "#4b5563",
            "header_bg": "#1f2937",
            "header_text": "#ffffff",
            "body_text": "#1f2937",
            "muted_text": "#6b7280",
            "section_border": "#1f2937",
            "skill_pill_bg": "#f3f4f6",
            "skill_pill_text": "#1f2937",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 22,
            "section_size": 12,
            "body_size": 10.5,
            "font": "Times-Roman",
            "heading_style": "uppercase",
            "name_align": "center",
        },
        "features": {
            "has_colored_header": True,
            "has_skill_pills": False,
            "skills_position": "after-summary",
            "projects_position": "after-experience",
            "compact": False,
        },
    },
    "skills-first-hybrid": {
        "layout": "single-column",
        "legacy_id": "template_8",
        "colors": {
            "primary": "#7c3aed",
            "secondary": "#a78bfa",
            "header_bg": "#ffffff",
            "header_text": "#7c3aed",
            "body_text": "#1f2937",
            "muted_text": "#6b7280",
            "section_border": "#7c3aed",
            "skill_pill_bg": "#f5f3ff",
            "skill_pill_text": "#7c3aed",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 20,
            "section_size": 12,
            "body_size": 10,
            "font": "Helvetica",
            "heading_style": "uppercase",
            "name_align": "left",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": True,
            "skills_position": "top",
            "projects_position": "after-experience",
            "compact": False,
        },
    },
    "project-heavy-developer": {
        "layout": "single-column",
        "legacy_id": "template_9",
        "colors": {
            "primary": "#dc2626",
            "secondary": "#f87171",
            "header_bg": "#ffffff",
            "header_text": "#dc2626",
            "body_text": "#1f2937",
            "muted_text": "#6b7280",
            "section_border": "#dc2626",
            "skill_pill_bg": "#fef2f2",
            "skill_pill_text": "#dc2626",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 20,
            "section_size": 12,
            "body_size": 10,
            "font": "Helvetica",
            "heading_style": "bold-only",
            "name_align": "center",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": True,
            "skills_position": "after-summary",
            "projects_position": "top",
            "compact": False,
        },
    },
    "elegant-corporate": {
        "layout": "single-column",
        "legacy_id": "template_10",
        "colors": {
            "primary": "#b45309",
            "secondary": "#f59e0b",
            "header_bg": "#ffffff",
            "header_text": "#b45309",
            "body_text": "#1f2937",
            "muted_text": "#6b7280",
            "section_border": "#b45309",
            "skill_pill_bg": "#fffbeb",
            "skill_pill_text": "#b45309",
            "background": "#ffffff",
        },
        "typography": {
            "name_size": 22,
            "section_size": 12,
            "body_size": 10,
            "font": "Times-Roman",
            "heading_style": "titlecase",
            "name_align": "left",
        },
        "features": {
            "has_colored_header": False,
            "has_skill_pills": False,
            "skills_position": "after-summary",
            "projects_position": "after-experience",
            "compact": False,
        },
    },
}

# Ordered list of all slug IDs (matches RESUME_TEMPLATES order in TypeScript)
ALL_TEMPLATE_IDS: List[str] = list(TEMPLATES.keys())

# Free-tier templates (no plan upgrade required)
FREE_TEMPLATE_IDS: List[str] = [
    "classic-professional",
    "compact-ats",
    "modern-ats-professional",
]


def get_template_config(template_id: str) -> Dict[str, Any]:
    """Return the config dict for a slug ID, or the default if not found."""
    return TEMPLATES.get(template_id, TEMPLATES["classic-professional"])
