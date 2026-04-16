"""
Filename builder for exported resume files.

Format:  <UserName>_<JobTitle>.<ext>
Fallbacks:
  - No job title  → <UserName>_Tailored_Resume.<ext>
  - No user name  → Candidate_<JobTitle>.<ext>
  - Neither       → Tailored_Resume.<ext>
"""

import re
from typing import Optional


def build_resume_filename(
    user_name: Optional[str],
    job_title: Optional[str],
    extension: str,
) -> str:
    """
    Build a safe, human-readable filename for exported resume files.

    Rules:
    - Spaces → underscores
    - Invalid filename characters removed
    - Consecutive underscores collapsed
    - Basename capped at 100 chars
    - Readable casing preserved
    """
    ext = extension.lstrip(".")

    def sanitize(part: str) -> str:
        # Keep word characters, spaces, hyphens; strip everything else
        part = re.sub(r"[^\w\s\-]", "", part)
        part = part.strip()
        part = re.sub(r"[\s\-]+", "_", part)   # spaces and hyphens → underscore
        part = re.sub(r"_+", "_", part)         # collapse duplicates
        return part.strip("_")

    name_part = sanitize(user_name or "")
    title_part = sanitize(job_title or "")

    if name_part and title_part:
        base = f"{name_part}_{title_part}"
    elif name_part:
        base = f"{name_part}_Tailored_Resume"
    elif title_part:
        base = f"Candidate_{title_part}"
    else:
        base = "Tailored_Resume"

    # Final dedup + length cap
    base = re.sub(r"_+", "_", base)[:100]
    return f"{base}.{ext}"
