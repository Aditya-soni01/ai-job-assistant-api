from typing import Optional, List, Dict, Any
from anthropic import Anthropic
import logging
import json
import re
from datetime import datetime

logger = logging.getLogger(__name__)


class AIService:
    """
    Service layer for AI-powered job assistant features using Claude API.
    Handles resume optimization, cover letter generation, and job-resume matching.
    """

    def __init__(self, api_key: str):
        """
        Initialize AI service with Anthropic Claude client.

        Args:
            api_key: Anthropic API key for Claude access
        """
        self.client = Anthropic(api_key=api_key) if api_key else Anthropic()
        self.model = "claude-sonnet-4-6"
        self.conversation_history: List[Dict[str, str]] = []

    def _add_to_history(self, role: str, content: str) -> None:
        """
        Add message to conversation history for multi-turn context.

        Args:
            role: "user" or "assistant"
            content: Message content
        """
        self.conversation_history.append({"role": role, "content": content})

    def _clear_history(self) -> None:
        """Clear conversation history."""
        self.conversation_history = []

    def optimize_resume(
        self,
        resume_text: str,
        target_job_title: Optional[str] = None,
        target_skills: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Analyze and optimize resume for better job matching.
        Provides specific recommendations for improvement.

        Args:
            resume_text: Current resume content
            target_job_title: Optional job title to optimize for
            target_skills: Optional list of skills to emphasize

        Returns:
            Dictionary with optimization suggestions and improved resume
        """
        self._clear_history()

        prompt = f"""Analyze this resume and provide optimization recommendations.

Resume:
{resume_text}

{f'Target Job Title: {target_job_title}' if target_job_title else ''}
{f'Target Skills to Emphasize: {", ".join(target_skills)}' if target_skills else ''}

Provide your analysis in this JSON format:
{{
    "strengths": ["strength1", "strength2", ...],
    "weaknesses": ["weakness1", "weakness2", ...],
    "recommendations": ["rec1", "rec2", ...],
    "skills_to_highlight": ["skill1", "skill2", ...],
    "optimized_summary": "2-3 sentence professional summary tailored to the role"
}}

Focus on:
1. Relevance to the target job (if provided)
2. Action verbs and quantifiable achievements
3. Technical skills prominence
4. ATS optimization (keyword density, formatting)
5. Professional tone and clarity"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = response.content[0].text
            self._add_to_history("user", prompt)
            self._add_to_history("assistant", response_text)

            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                analysis = json.loads(json_str)
            else:
                analysis = {"raw_analysis": response_text}

            return {
                "status": "success",
                "analysis": analysis,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return {
                "status": "error",
                "message": "Failed to parse optimization analysis",
                "raw_response": response_text,
            }
        except Exception as e:
            logger.error(f"Error optimizing resume: {e}")
            return {"status": "error", "message": str(e)}

    def optimize_resume_for_job(
        self,
        resume_text: str,
        job_description: str,
        job_title: str = "",
    ) -> Dict[str, Any]:
        """
        Fully rewrite a resume tailored to a specific job description.
        Returns structured JSON with all resume sections + ATS scoring.
        """
        self._clear_history()

        prompt = f"""You are a professional resume writer and ATS optimization expert.

Rewrite the following resume to be perfectly tailored for the job description provided.

REQUIREMENTS:
1. Maximize ATS (Applicant Tracking System) compatibility
2. Integrate relevant keywords from the job description naturally
3. Quantify achievements with metrics/numbers wherever possible
4. Use strong action verbs (Led, Built, Increased, Reduced, Delivered, Architected, etc.)
5. Preserve all existing sections: Summary, Skills, Experience, Education, Projects
6. Remove irrelevant information
7. Professional and concise tone throughout

RESUME:
{resume_text}

JOB DESCRIPTION:
{job_description}

{f'JOB TITLE: {job_title}' if job_title else ''}

Return ONLY a valid JSON object — no extra text, no markdown fences:
{{
    "full_name": "Full Name from resume",
    "contact": "email | phone | location",
    "summary": "2-3 sentence tailored professional summary aligned to the JD",
    "skills": ["skill1", "skill2", "skill3"],
    "experience": [
        {{
            "title": "Job Title",
            "company": "Company Name",
            "duration": "Month Year - Month Year",
            "achievements": [
                "Quantified achievement using JD keywords",
                "Another strong achievement with business impact"
            ]
        }}
    ],
    "education": [
        {{
            "degree": "Degree Name",
            "institution": "School Name",
            "year": "Graduation Year"
        }}
    ],
    "projects": [
        {{
            "name": "Project Name",
            "description": "Brief description with relevant technologies",
            "technologies": ["tech1", "tech2"]
        }}
    ],
    "certifications": ["cert1", "cert2"],
    "ats_score_before": 40,
    "ats_score_after": 82,
    "keywords_added": ["keyword1", "keyword2", "keyword3"]
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = response.content[0].text

            # Strip markdown fences if present
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start == -1 or json_end <= json_start:
                raise ValueError("No JSON object found in response")

            structured = json.loads(response_text[json_start:json_end])
            return {"status": "success", "data": structured, "timestamp": datetime.utcnow().isoformat()}

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse structured resume JSON: {e}")
            return {"status": "error", "message": "AI returned malformed JSON"}
        except Exception as e:
            logger.error(f"Error in optimize_resume_for_job: {e}")
            return {"status": "error", "message": str(e)}

    def generate_cover_letter(
        self,
        resume_text: str,
        job_title: str,
        company_name: str,
        job_description: str,
        user_name: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate a customized cover letter based on resume and job details.

        Args:
            resume_text: User's resume content
            job_title: Target job title
            company_name: Target company name
            job_description: Job description from posting
            user_name: Optional user name for personalization

        Returns:
            Dictionary with generated cover letter and key highlights
        """
        self._clear_history()

        prompt = f"""Generate a professional cover letter for this job application.

User Resume:
{resume_text}

Job Details:
- Title: {job_title}
- Company: {company_name}
- Description: {job_description}

{f'Applicant Name: {user_name}' if user_name else ''}

Requirements:
1. Length: 3-4 paragraphs
2. Professional tone
3. Highlight relevant skills from resume that match job requirements
4. Show genuine interest in the company
5. Include specific examples from resume
6. Strong opening and closing paragraphs
7. ATS-friendly formatting (no special characters)

Format your response as:
COVER_LETTER:
[Full cover letter text here]

KEY_HIGHLIGHTS:
[List 3-4 key selling points matched to job requirements]"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = response.content[0].text
            self._add_to_history("user", prompt)
            self._add_to_history("assistant", response_text)

            cover_letter = ""
            key_highlights = []

            if "COVER_LETTER:" in response_text:
                letter_section = response_text.split("COVER_LETTER:")[1]
                if "KEY_HIGHLIGHTS:" in letter_section:
                    cover_letter = letter_section.split("KEY_HIGHLIGHTS:")[0].strip()
                else:
                    cover_letter = letter_section.strip()

            if "KEY_HIGHLIGHTS:" in response_text:
                highlights_section = response_text.split("KEY_HIGHLIGHTS:")[1].strip()
                key_highlights = [
                    line.strip().lstrip("-•* ").strip()
                    for line in highlights_section.split("\n")
                    if line.strip() and not line.strip().startswith("```")
                ]

            return {
                "status": "success",
                "cover_letter": cover_letter,
                "key_highlights": key_highlights,
                "job_applied": {"title": job_title, "company": company_name},
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            logger.error(f"Error generating cover letter: {e}")
            return {"status": "error", "message": str(e)}

    def score_job_match(
        self,
        resume_text: str,
        job_title: str,
        job_description: str,
        required_skills: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Score how well a resume matches a job posting (0-100).
        Provides detailed breakdown of matching areas.

        Args:
            resume_text: User's resume content
            job_title: Target job title
            job_description: Complete job description
            required_skills: Optional list of required skills from job posting

        Returns:
            Dictionary with match score, breakdown, and recommendations
        """
        self._clear_history()

        prompt = f"""Analyze the match between this resume and job posting.

Resume:
{resume_text}

Job Details:
- Title: {job_title}
- Description: {job_description}
{f'- Required Skills: {", ".join(required_skills)}' if required_skills else ''}

Evaluate and respond in this JSON format:
{{
    "overall_match_score": 0-100,
    "skill_match_score": 0-100,
    "experience_match_score": 0-100,
    "matched_skills": ["skill1", "skill2", ...],
    "missing_skills": ["skill1", "skill2", ...],
    "strengths_for_role": ["strength1", "strength2", ...],
    "improvement_areas": ["area1", "area2", ...],
    "recommendation": "hire/consider/upskill_needed",
    "summary": "One sentence summary of fit"
}}

Score breakdown:
- 90-100: Excellent match, immediate consideration
- 75-89: Strong match, good fit
- 60-74: Moderate match, has potential
- 45-59: Weak match, needs development
- Below 45: Poor match, significant gaps"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = response.content[0].text
            self._add_to_history("user", prompt)
            self._add_to_history("assistant", response_text)

            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                match_analysis = json.loads(json_str)
            else:
                match_analysis = {"raw_analysis": response_text}

            return {
                "status": "success",
                "job_match": match_analysis,
                "analyzed_job": {"title": job_title},
                "timestamp": datetime.utcnow().isoformat(),
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse match score response as JSON: {e}")
            return {
                "status": "error",
                "message": "Failed to parse job match analysis",
                "raw_response": response_text,
            }
        except Exception as e:
            logger.error(f"Error scoring job match: {e}")
            return {"status": "error", "message": str(e)}

    def improve_section(self, section: str, current_text: str, job_description: str) -> Dict[str, Any]:
        """
        Improve a specific resume section to better match a job description.

        Args:
            section: Section name (e.g. professional_summary, experience_0)
            current_text: The current text of the section
            job_description: Target job description for context

        Returns:
            Dictionary with improved_text and changes_made
        """
        section_label = section.replace("_", " ").replace("experience ", "experience entry ").title()
        prompt = f"""You are an expert resume writer. Improve ONLY this {section_label} section to better match the job description.

CURRENT {section_label.upper()}:
{current_text}

JOB DESCRIPTION:
{job_description}

Rules:
- Use STAR method for experience bullets (Situation, Task, Action, Result)
- Include relevant keywords from the JD naturally
- Quantify achievements where possible
- Keep the tone professional and concise
- Do NOT add fictional data; only rewrite what is given

Return ONLY valid JSON:
{{"improved_text": "the rewritten section text", "changes_made": ["change1", "change2"]}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = response.content[0].text.strip()
            # Strip markdown fences if present
            if response_text.startswith("```"):
                response_text = response_text.split("```")[1]
                if response_text.startswith("json"):
                    response_text = response_text[4:]
                response_text = response_text.strip()

            result = json.loads(response_text)
            return {
                "improved_text": result.get("improved_text", current_text),
                "changes_made": result.get("changes_made", []),
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse improve_section response: {e}")
            return {"improved_text": current_text, "changes_made": []}
        except Exception as e:
            logger.error(f"Error improving section: {e}")
            return {"status": "error", "message": str(e)}

    def extract_resume_data(self, resume_text: str) -> Dict[str, Any]:
        """
        Extract structured data from unstructured resume text.
        Identifies sections, skills, experience, education, etc.

        Args:
            resume_text: Raw resume content

        Returns:
            Dictionary with extracted structured data
        """
        self._clear_history()

        prompt = f"""Extract and structure data from this resume.

Resume:
{resume_text}

Respond in this JSON format:
{{
    "full_name": "extracted name if present",
    "email": "email if present",
    "phone": "phone if present",
    "professional_summary": "summary/objective if present",
    "skills": ["skill1", "skill2", ...],
    "experience": [
        {{
            "job_title": "title",
            "company": "company",
            "duration": "duration description",
            "responsibilities": ["resp1", "resp2", ...]
        }}
    ],
    "education": [
        {{
            "degree": "degree type",
            "field": "field of study",
            "institution": "school/university",
            "graduation_year": "year if present"
        }}
    ],
    "certifications": ["cert1", "cert2", ...],
    "languages": ["language1", "language2", ...],
    "years_of_experience": total_years
}}

Extract all identifiable information. Use null for missing fields."""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2000,
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = response.content[0].text
            self._add_to_history("user", prompt)
            self._add_to_history("assistant", response_text)

            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start != -1 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                extracted_data = json.loads(json_str)
            else:
                extracted_data = {"raw_text": response_text}

            return {
                "status": "success",
                "data": extracted_data,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse extracted resume data as JSON: {e}")
            return {
                "status": "error",
                "message": "Failed to extract resume data",
                "raw_response": response_text,
            }
        except Exception as e:
            logger.error(f"Error extracting resume data: {e}")
            return {"status": "error", "message": str(e)}

    def analyze_resume_job_fit(
        self,
        resume_text: str,
        job_title: str,
        company_name: str,
        job_description: str,
        required_skills: str = "",
    ) -> Dict[str, Any]:
        """
        Stage 1 of the two-stage optimization pipeline.
        Analyzes resume against job description and returns structured fit analysis.
        """
        self._clear_history()

        prompt = f"""You are an expert resume analyst and ATS specialist. Perform a detailed analysis of the resume against the job description.

RESUME TEXT:
{resume_text}

JOB TITLE: {job_title}
COMPANY: {company_name}
JOB DESCRIPTION:
{job_description}
REQUIRED SKILLS: {required_skills}

IMPORTANT: Extract ONLY information that is explicitly present in the resume text above. Do NOT infer, suggest, or add certifications, skills, or projects that are not explicitly stated. Only list certifications that are clearly present as existing qualifications. Only extract projects that actually appear in the resume.

Analyze and return ONLY a JSON object with these exact keys:
{{
  "candidate_name": "extracted full name",
  "candidate_email": "extracted email or empty string",
  "candidate_phone": "extracted phone or empty string",
  "candidate_location": "extracted location or empty string",
  "linkedin_url": "extracted linkedin URL or empty string",
  "portfolio_url": "extracted portfolio/github URL or empty string",

  "matched_hard_skills": ["skill1", "skill2"],
  "matched_soft_skills": ["skill1", "skill2"],
  "missing_critical_skills": ["skill1", "skill2"],
  "missing_nice_to_have_skills": ["skill1", "skill2"],
  "transferable_skills": ["skill that maps to a required skill"],

  "experience_entries": [
    {{
      "original_title": "what the resume says",
      "company": "company name",
      "duration": "date range",
      "relevance_score": 85,
      "relevant_keywords_found": ["keyword1", "keyword2"],
      "suggested_reorder_priority": 1
    }}
  ],

  "education_entries": [
    {{"degree": "", "institution": "", "year": "", "relevant_coursework": []}}
  ],

  "certifications": ["cert1", "cert2"],
  "projects": [{{"name": "", "description": "", "technologies": []}}],

  "ats_score_before": 42,
  "gap_analysis": "2-3 sentence summary of gaps between resume and job",
  "reorder_strategy": "brief explanation of how to restructure for maximum impact"
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2500,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = response.content[0].text

            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start == -1 or json_end <= json_start:
                raise ValueError("No JSON object found in Stage 1 response")

            return json.loads(response_text[json_start:json_end])

        except Exception as e:
            logger.error(f"Stage 1 analysis error: {e}")
            raise

    def generate_optimized_resume(
        self,
        resume_text: str,
        analysis: Dict[str, Any],
        job_title: str,
        company_name: str,
        job_description: str,
    ) -> Dict[str, Any]:
        """
        Stage 2 of the two-stage optimization pipeline.
        Uses Stage 1 analysis as context to fully rewrite the resume.
        """
        stage_1_json = json.dumps(analysis, indent=2)

        prompt = f"""You are a senior technical recruiter and professional resume writer. \
Rewrite this resume as a Hybrid Resume — one that passes ATS screening AND reads naturally to a human recruiter.

STAGE 1 ANALYSIS:
{stage_1_json}

ORIGINAL RESUME:
{resume_text}

TARGET JOB: {job_title} at {company_name}
JOB DESCRIPTION:
{job_description}

━━━ CRITICAL ANTI-HALLUCINATION RULES — NEVER VIOLATE ━━━

1. NEVER invent, fabricate, or hallucinate ANY information not present in the original resume:
   - Do NOT create projects that don't exist in the original
   - Do NOT add certifications the candidate doesn't have
   - Do NOT claim skills not mentioned or clearly implied by the original
   - Do NOT fabricate metrics, percentages, or achievements
2. You may REPHRASE, REORDER, and REFRAME existing content — you may NOT ADD fictional content.
3. If the original resume mentions a skill or experience even briefly, you may expand on it. You cannot create something from nothing.
4. For certifications: ONLY include certifications explicitly listed in the original resume. Do NOT add "recommended" or "in progress" certifications.
5. For projects: ONLY include projects mentioned in the original resume. Rewrite descriptions to match the JD but don't invent new ones.

━━━ HYBRID RESUME RULES ━━━

PHILOSOPHY — balance both audiences:
• ATS parser: needs keywords, standard section headings, parseable structure
• Human recruiter: needs clear impact, readable sentences, no keyword stuffing

SECTION RULES:

1. PROFESSIONAL SUMMARY (3-4 sentences, 60-80 words MAX)
   - Sentence 1: Years of experience + core role + 1-2 signature technologies
   - Sentence 2: Specific value you bring to THIS role (tie to a JD requirement)
   - Sentence 3 (optional): One standout achievement or differentiator
   - DO NOT list skills. DO NOT use first person ("I"). Write in present tense.
   - DO NOT try to mention every skill from the JD. Focus on the 4-5 most important ones.
   - Sound like a confident human wrote it, not a keyword-matching algorithm.
   - BAD: "Results-driven developer with expertise in multiple technologies across various domains..."
   - GOOD: "Backend developer with 3+ years building ASP.NET Core APIs for enterprise clients."

2. SKILLS (split into Technical and Professional — max 20 total)
   - Include only skills the candidate actually has — no padding
   - Mirror JD terminology where the candidate's skill is equivalent
   - Technical Skills: tools, languages, frameworks, platforms
   - Professional Skills: soft skills, methodologies, practices
   - Max 20 total skills combined; pick the most JD-relevant ones
   - NEVER add "(in progress)", "(learning)", "(basic)", or any qualifying labels to skills
   - If a skill is listed as "in progress" in the original: include it without the qualifier if they have demonstrable experience, or omit it entirely if it would weaken the section
   - NEVER mark skills with proficiency levels or completion status

3. EXPERIENCE (preserve sub-project structure and specific technical details)
   - PRESERVE project names and sub-headings from the original resume. If the original groups bullets under project names (e.g., "Data Centre Management Application", "E-Commerce & Auction Platform"), keep that structure using the "projects" array in the JSON schema below — one entry per sub-project with its own name and bullets.
   - PRESERVE specific technical details: library names, API names, parameter counts, compliance standards (HIPAA, GDPR), architectural patterns (UDTT, CQRS, etc.)
   - Rewrite bullets using STAR method BUT keep the original technical specificity:
     BETTER: "Reduced response times by 50% by consolidating calls into a single stored procedure using UDTT"
     WORSE: "Optimized API response times by 50% through efficient backend design"
   - The goal is to REFRAME existing details to match JD language — not REPLACE details with vague rewrites.
   - Format per bullet: [Strong verb] + [what you did] + [technology/context] + [outcome/scale]
   - Keep each bullet to 1-2 lines; one idea per bullet
   - Lead with the strongest, most JD-relevant bullet for each role or project
   - Include real metrics where the original resume has them — do NOT invent numbers
   - DO NOT use robotic STAR templates — write like a senior engineer would describe their work

4. PROJECTS section (top-level projects — 1-2 bullets per project)
   - State what was built, the key tech, and why it matters or what it achieved
   - Keep it factual; do not embellish
   - ONLY include projects from the original resume

5. ATS REQUIREMENTS
   - Use exact section heading names: Professional Summary, Skills, Experience, Education, Certifications, Projects
   - Include both full forms and abbreviations where natural (e.g., "Entity Framework Core (EF Core)")
   - Do NOT use tables, columns, or special characters in bullet text

6. TERMINOLOGY MAPPING
   - When the candidate has a skill equivalent to a JD requirement, use the JD's EXACT terminology in skills and bullets.
   - Examples: If JD says "Angular 12+" and candidate worked with Angular, list "Angular 12+". If JD says "Jasmine/Jest" and candidate has testing experience, include "Jasmine/Jest".
   - Include BOTH the JD's exact term AND the candidate's original term when different but related (e.g., "CI/CD Pipelines (Azure DevOps)").

Return ONLY a valid JSON object — no markdown, no extra text:
{{
  "full_name": "exact name from resume",
  "contact": {{
    "email": "from resume",
    "phone": "from resume",
    "location": "City, Country or City, State",
    "linkedin": "url or empty string",
    "portfolio": "url or empty string"
  }},
  "professional_summary": "3-4 sentence hybrid summary (60-80 words)",
  "technical_skills": ["skill1", "skill2"],
  "professional_skills": ["skill1", "skill2"],
  "experience": [
    {{
      "title": "Job Title from resume (keep accurate)",
      "company": "Company Name",
      "location": "City or Remote",
      "duration": "Mon YYYY - Mon YYYY",
      "projects": [
        {{
          "name": "Sub-project name if original has one, or empty string for general bullets",
          "bullets": [
            "Strong verb + what + tech/context + outcome"
          ]
        }}
      ]
    }}
  ],
  "education": [
    {{
      "degree": "Degree Name",
      "institution": "Institution Name",
      "year": "Graduation Year",
      "details": "relevant coursework or honors if present, else empty string"
    }}
  ],
  "certifications": ["only certs explicitly listed in original resume"],
  "projects": [
    {{
      "name": "Project Name",
      "technologies": "Tech1, Tech2, Tech3",
      "bullets": ["What was built and why it matters"]
    }}
  ],
  "ats_score_after": 85,
  "keywords_added": ["keyword1", "keyword2"],
  "key_improvements": [
    "One concrete improvement made",
    "Second concrete improvement made"
  ]
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = response.content[0].text

            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]

            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start == -1 or json_end <= json_start:
                raise ValueError("No JSON object found in Stage 2 response")

            return json.loads(response_text[json_start:json_end])

        except Exception as e:
            logger.error(f"Stage 2 generation error: {e}")
            raise

    # ── Profile-aware v2 pipeline ─────────────────────────────────────────────

    def analyze_resume_job_fit_v2(
        self,
        profile_data: dict,
        resume_text: str,
        job_title: str,
        company_name: str,
        job_description: str,
    ) -> dict:
        """
        Stage 1 v2 — profile-aware fit analysis.
        Uses structured profile as primary source; resume text for style reference.
        """
        profile_json = json.dumps(profile_data, indent=2)

        prompt = f"""You are an expert ATS analyst. Analyze this candidate's profile against the job description.

STRUCTURED PROFILE (source of truth):
{profile_json}

RAW RESUME TEXT (style reference only):
{resume_text}

TARGET JOB: {job_title} at {company_name}
JOB DESCRIPTION:
{job_description}

Analyze and return ONLY a JSON object:
{{
  "candidate_name": "{profile_data.get('name', '')}",
  "candidate_email": "{profile_data.get('email', '')}",
  "candidate_phone": "{profile_data.get('phone', '') or ''}",
  "candidate_location": "{profile_data.get('location', '') or ''}",
  "linkedin_url": "{profile_data.get('linkedin', '') or ''}",
  "portfolio_url": "{profile_data.get('portfolio', '') or ''}",

  "matched_hard_skills": ["skills from profile that match JD"],
  "matched_soft_skills": ["soft skills from profile that match JD"],
  "missing_critical_skills": ["JD requirements not in profile"],
  "missing_nice_to_have_skills": ["nice-to-haves not in profile"],
  "transferable_skills": ["profile skills that map to JD requirements"],

  "experience_entries": [
    {{
      "original_title": "job title from profile",
      "company": "company",
      "duration": "start - end",
      "relevance_score": 80,
      "relevant_keywords_found": ["kw1"],
      "suggested_reorder_priority": 1
    }}
  ],

  "education_entries": [
    {{"degree": "", "institution": "", "year": "", "relevant_coursework": []}}
  ],

  "certifications": ["only certs in profile"],
  "projects": [{{"name": "", "description": "", "technologies": []}}],

  "ats_score_before": 45,
  "gap_analysis": "2-3 sentence summary of gaps",
  "reorder_strategy": "brief restructuring recommendation"
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2500,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = response.content[0].text
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start == -1 or json_end <= json_start:
                raise ValueError("No JSON in v2 Stage 1 response")
            return json.loads(response_text[json_start:json_end])
        except Exception as e:
            logger.error(f"v2 Stage 1 error: {e}")
            raise

    def generate_optimized_resume_v2(
        self,
        profile_data: dict,
        resume_text: str,
        analysis: dict,
        job_title: str,
        company_name: str,
        job_description: str,
        tone: str = "professional",
    ) -> dict:
        """
        Stage 2 v2 — profile-constrained resume generation.
        Only uses content that exists in the structured profile.
        """
        profile_json = json.dumps(profile_data, indent=2)
        analysis_json = json.dumps(analysis, indent=2)

        prompt = f"""You are a senior technical recruiter and professional resume writer.
Rewrite this candidate's resume as a Hybrid Resume optimised for both ATS and human recruiters.

STAGE 1 ANALYSIS:
{analysis_json}

STRUCTURED PROFILE (SOURCE OF TRUTH):
{profile_json}

RAW RESUME TEXT (style/phrasing reference only):
{resume_text}

TARGET JOB: {job_title} at {company_name}
TONE: {tone}
JOB DESCRIPTION:
{job_description}

━━━ PROFILE-BASED GENERATION RULES ━━━

You have TWO data sources:
1. STRUCTURED PROFILE — This is the SOURCE OF TRUTH. Every fact MUST trace back to a field in the profile.
2. RAW RESUME TEXT — Style and phrasing reference only.

HARD CONSTRAINTS:
- Skills: ONLY use skills listed in the profile's skills object. Reorder and select the most relevant for the JD; do NOT add unlisted skills.
- Experience: ONLY use experiences from the profile. Preserve job titles, company names, and dates EXACTLY.
- Project bullets: You MAY rephrase bullets to better match the JD using STAR method, but core facts must be preserved. Do NOT invent metrics or achievements.
- Certifications: ONLY include certifications from the profile. If none, omit the section entirely.
- Education: Use exactly what's in the profile.
- Contact info: Use exactly what's in the profile.

You MAY:
- Reorder sections and bullets to prioritise JD relevance.
- Rephrase bullet points to use JD terminology.
- Write a new professional summary highlighting the most relevant profile content.
- Select a subset of skills most relevant to the JD.
- Reframe project descriptions to emphasise JD-relevant aspects.

━━━ FORMAT RULES ━━━
- Professional Summary: 3-4 sentences, 60-80 words. Present tense. No "I". No skill lists.
- Skills: split into technical_skills and professional_skills arrays, max 20 total.
- Experience: preserve sub-project structure under each role using "projects" array.
- NEVER add "(in progress)", proficiency qualifiers, or invented metrics.

Return ONLY valid JSON — no markdown, no extra text:
{{
  "full_name": "from profile",
  "contact": {{
    "email": "from profile",
    "phone": "from profile",
    "location": "from profile",
    "linkedin": "from profile",
    "portfolio": "from profile"
  }},
  "professional_summary": "3-4 sentence hybrid summary",
  "technical_skills": ["skill1", "skill2"],
  "professional_skills": ["skill1", "skill2"],
  "experience": [
    {{
      "title": "Job Title",
      "company": "Company Name",
      "location": "City or Remote",
      "duration": "Mon YYYY - Mon YYYY",
      "projects": [
        {{
          "name": "Sub-project name or empty string",
          "bullets": ["Strong verb + what + tech/context + outcome"]
        }}
      ]
    }}
  ],
  "education": [
    {{
      "degree": "Degree Name",
      "institution": "Institution Name",
      "year": "Year",
      "details": "coursework/honors or empty string"
    }}
  ],
  "certifications": ["only certs from profile"],
  "projects": [
    {{
      "name": "Standalone project name",
      "technologies": "Tech1, Tech2",
      "bullets": ["What was built and why it matters"]
    }}
  ],
  "ats_score_after": 85,
  "keywords_added": ["kw1", "kw2"],
  "key_improvements": ["Improvement 1", "Improvement 2"]
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4000,
                messages=[{"role": "user", "content": prompt}],
            )
            response_text = response.content[0].text
            if "```json" in response_text:
                response_text = response_text.split("```json")[1].split("```")[0]
            elif "```" in response_text:
                response_text = response_text.split("```")[1].split("```")[0]
            json_start = response_text.find("{")
            json_end = response_text.rfind("}") + 1
            if json_start == -1 or json_end <= json_start:
                raise ValueError("No JSON in v2 Stage 2 response")
            return json.loads(response_text[json_start:json_end])
        except Exception as e:
            logger.error(f"v2 Stage 2 error: {e}")
            raise

    def interview_prep(
        self,
        resume_text: str,
        job_title: str,
        company_name: str,
        job_description: str,
        question: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Multi-turn interview preparation coach.
        Asks interview questions and provides feedback on answers.

        Args:
            resume_text: User's resume
            job_title: Target job title
            company_name: Target company
            job_description: Job description
            question: Optional user's answer to previous question

        Returns:
            Dictionary with next question and feedback if applicable
        """
        if not question:
            self._clear_history()
            initial_prompt = f"""You are an expert interview coach. Prepare interview questions for this candidate.

Resume:
{resume_text}

Job Details:
- Title: {job_title}
- Company: {company_name}
- Description: {job_description}

Start by asking a strong opening question relevant to their background and the target role. 
Ask one question at a time. After the candidate answers, provide constructive feedback and ask a follow-up.

Format:
QUESTION: [Your interview question]
GUIDANCE: [Hint about what good answer should cover]"""

            try:
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=800,
                    messages=[{"role": "user", "content": initial_prompt}],
                )

                response_text = response.content[0].text
                self._add_to_history("user", initial_prompt)
                self._add_to_history("assistant", response_text)

                question_text = ""
                guidance = ""

                if "QUESTION:" in response_text:
                    question_section = response_text.split("QUESTION:")[1]
                    if "GUIDANCE:" in question_section:
                        question_text = question_section.split("GUIDANCE:")[0].strip()
                    else:
                        question_text = question_section.strip()

                if "GUIDANCE:" in response_text:
                    guidance = response_text.split("GUIDANCE:")[1].strip()

                return {
                    "status": "success",
                    "question": question_text,
                    "guidance": guidance,
                    "round": 1,
                    "timestamp": datetime.utcnow().isoformat(),
                }

            except Exception as e:
                logger.error(f"Error starting interview prep: {e}")
                return {"status": "error", "message": str(e)}

        else:
            follow_up_prompt = (
                f'The candidate answered: "{question}"\n\n'
                "Provide:\n"
                "1. Specific feedback on their answer (strengths and areas to improve)\n"
                "2. What they did well\n"
                "3. What could be improved\n"
                "4. A follow-up interview question\n\n"
                "Format:\n"
                "FEEDBACK: [Your feedback here]\n"
                "NEXT_QUESTION: [Next interview question]"
            )

            try:
                messages = self.conversation_history + [{"role": "user", "content": follow_up_prompt}]
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=800,
                    messages=messages,
                )

                response_text = response.content[0].text
                self._add_to_history("user", follow_up_prompt)
                self._add_to_history("assistant", response_text)

                feedback = ""
                next_question = ""

                if "FEEDBACK:" in response_text:
                    feedback_section = response_text.split("FEEDBACK:")[1]
                    if "NEXT_QUESTION:" in feedback_section:
                        feedback = feedback_section.split("NEXT_QUESTION:")[0].strip()
                    else:
                        feedback = feedback_section.strip()

                if "NEXT_QUESTION:" in response_text:
                    next_question = response_text.split("NEXT_QUESTION:")[1].strip()

                return {
                    "status": "success",
                    "feedback": feedback,
                    "next_question": next_question,
                    "timestamp": datetime.utcnow().isoformat(),
                }

            except Exception as e:
                logger.error(f"Error during interview follow-up: {e}")
                return {"status": "error", "message": str(e)}

    async def extract_profile_from_resume(self, resume_text: str) -> Dict[str, Any]:
        """Extract structured profile data from raw resume text."""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=3000,
            messages=[{"role": "user", "content": f"""Extract structured profile data from this resume. Return ONLY valid JSON.

RESUME TEXT:
{resume_text}

Return this exact JSON structure:
{{
  "first_name": "",
  "last_name": "",
  "email": "",
  "phone": "",
  "location": "",
  "linkedin_url": "",
  "github_url": "",
  "portfolio_url": "",
  "professional_summary": "the existing summary as-is, don't rewrite",
  "profile_headline": "a short headline derived from their current title and stack",
  "skills": [
    {{"name": "C#", "category": "language"}},
    {{"name": "ASP.NET Core", "category": "framework"}},
    {{"name": "SQL Server", "category": "database"}},
    {{"name": "Azure DevOps", "category": "tool"}},
    {{"name": "Problem Solving", "category": "soft_skill"}}
  ],
  "experiences": [
    {{
      "job_title": "",
      "company": "",
      "location": "",
      "start_date": "Mon YYYY",
      "end_date": "Mon YYYY or null if current",
      "is_current": false,
      "description": "brief role overview",
      "projects": [
        {{
          "name": "Project Name (if mentioned)",
          "description": "what the project is",
          "technologies": "tech1, tech2",
          "bullets": ["achievement 1 exactly as written in resume", "achievement 2"]
        }}
      ]
    }}
  ],
  "education": [
    {{"degree": "", "institution": "", "year": "", "details": ""}}
  ],
  "certifications": [
    {{"name": "", "issuer": "", "date": ""}}
  ]
}}

RULES:
- Extract ONLY what is explicitly in the resume. Do NOT invent or infer anything.
- For skills, categorize each into: language, framework, database, tool, cloud, soft_skill, other
- Preserve project names that appear under experience entries
- Keep bullet points exactly as written — do NOT rewrite them
- If a field isn't present in the resume, use empty string or null
- For certifications: ONLY include ones that are actually completed, not "in progress" or "recommended"
"""}],
        )
        text = response.content[0].text
        json_match = re.search(r'\{[\s\S]*\}', text)
        if json_match:
            return json.loads(json_match.group(0))
        raise ValueError("Failed to parse profile from resume")