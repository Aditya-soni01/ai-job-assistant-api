"""Add job fields: category, skills, salary, experience_level.

Revision ID: 002
Revises: 001
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "002"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add new columns to jobs table."""
    # Add salary_min and salary_max columns
    op.add_column(
        "jobs",
        sa.Column("salary_min", sa.Float(), nullable=True)
    )
    op.add_column(
        "jobs",
        sa.Column("salary_max", sa.Float(), nullable=True)
    )
    
    # Add experience_level column with default value
    op.add_column(
        "jobs",
        sa.Column("experience_level", sa.String(50), nullable=False, server_default="mid")
    )
    
    # Add required_skills as JSON column
    op.add_column(
        "jobs",
        sa.Column("required_skills", sa.JSON(), nullable=True, server_default="[]")
    )
    
    # Add job_type column
    op.add_column(
        "jobs",
        sa.Column("job_type", sa.String(100), nullable=True)
    )
    
    # Add remote column
    op.add_column(
        "jobs",
        sa.Column("remote", sa.Boolean(), nullable=False, server_default="0")
    )
    
    # Create index on experience_level for faster filtering
    op.create_index("ix_jobs_experience_level", "jobs", ["experience_level"])


def downgrade() -> None:
    """Remove added columns from jobs table."""
    op.drop_index("ix_jobs_experience_level", table_name="jobs")
    op.drop_column("jobs", "remote")
    op.drop_column("jobs", "job_type")
    op.drop_column("jobs", "required_skills")
    op.drop_column("jobs", "experience_level")
    op.drop_column("jobs", "salary_max")
    op.drop_column("jobs", "salary_min")