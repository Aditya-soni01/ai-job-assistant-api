"""Add profile tables and user profile columns.

Revision ID: 004
Revises: 003
Create Date: 2026-04-15

"""
from alembic import op
import sqlalchemy as sa

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── New columns on users ──────────────────────────────────────────────────
    op.add_column("users", sa.Column("profile_headline", sa.String(200), nullable=True))
    op.add_column("users", sa.Column("phone", sa.String(20), nullable=True))
    op.add_column("users", sa.Column("location", sa.String(100), nullable=True))
    op.add_column("users", sa.Column("linkedin_url", sa.String(300), nullable=True))
    op.add_column("users", sa.Column("github_url", sa.String(300), nullable=True))
    op.add_column("users", sa.Column("portfolio_url", sa.String(300), nullable=True))
    op.add_column("users", sa.Column("professional_summary", sa.Text(), nullable=True))
    op.add_column("users", sa.Column("profile_completeness", sa.Integer(), nullable=True, server_default="0"))
    op.add_column("users", sa.Column("preferences", sa.JSON(), nullable=True))
    op.add_column("users", sa.Column("is_profile_complete", sa.Boolean(), nullable=True, server_default="0"))

    # ── user_skills ──────────────────────────────────────────────────────────
    op.create_table(
        "user_skills",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("category", sa.String(50), nullable=False),
        sa.Column("proficiency", sa.String(20), nullable=True),
    )
    op.create_index("ix_user_skills_user_id", "user_skills", ["user_id"])

    # ── user_experiences ─────────────────────────────────────────────────────
    op.create_table(
        "user_experiences",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("job_title", sa.String(200), nullable=False),
        sa.Column("company", sa.String(200), nullable=False),
        sa.Column("location", sa.String(100), nullable=True),
        sa.Column("start_date", sa.String(20), nullable=False),
        sa.Column("end_date", sa.String(20), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=True, server_default="0"),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("order_index", sa.Integer(), nullable=True, server_default="0"),
    )
    op.create_index("ix_user_experiences_user_id", "user_experiences", ["user_id"])

    # ── user_projects ────────────────────────────────────────────────────────
    op.create_table(
        "user_projects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("experience_id", sa.Integer(), sa.ForeignKey("user_experiences.id", ondelete="SET NULL"), nullable=True),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("technologies", sa.String(500), nullable=True),
        sa.Column("bullets", sa.JSON(), nullable=True),
    )
    op.create_index("ix_user_projects_user_id", "user_projects", ["user_id"])

    # ── user_education ───────────────────────────────────────────────────────
    op.create_table(
        "user_education",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("degree", sa.String(200), nullable=False),
        sa.Column("institution", sa.String(200), nullable=False),
        sa.Column("year", sa.String(20), nullable=True),
        sa.Column("details", sa.Text(), nullable=True),
    )
    op.create_index("ix_user_education_user_id", "user_education", ["user_id"])

    # ── user_certifications ──────────────────────────────────────────────────
    op.create_table(
        "user_certifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(300), nullable=False),
        sa.Column("issuer", sa.String(200), nullable=True),
        sa.Column("date", sa.String(20), nullable=True),
        sa.Column("credential_url", sa.String(500), nullable=True),
    )
    op.create_index("ix_user_certifications_user_id", "user_certifications", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_user_certifications_user_id", table_name="user_certifications")
    op.drop_table("user_certifications")
    op.drop_index("ix_user_education_user_id", table_name="user_education")
    op.drop_table("user_education")
    op.drop_index("ix_user_projects_user_id", table_name="user_projects")
    op.drop_table("user_projects")
    op.drop_index("ix_user_experiences_user_id", table_name="user_experiences")
    op.drop_table("user_experiences")
    op.drop_index("ix_user_skills_user_id", table_name="user_skills")
    op.drop_table("user_skills")

    op.drop_column("users", "is_profile_complete")
    op.drop_column("users", "preferences")
    op.drop_column("users", "profile_completeness")
    op.drop_column("users", "professional_summary")
    op.drop_column("users", "portfolio_url")
    op.drop_column("users", "github_url")
    op.drop_column("users", "linkedin_url")
    op.drop_column("users", "location")
    op.drop_column("users", "phone")
    op.drop_column("users", "profile_headline")
