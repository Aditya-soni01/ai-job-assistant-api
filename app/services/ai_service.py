from typing import Optional, List, Dict, Any
from anthropic import Anthropic
import logging
import json
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
        self.client = Anthropic()
        self.model = "claude-3-5-sonnet-20241022"
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