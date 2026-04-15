"""Add ai_request_log table for tracking AI API requests.

Revision ID: 003
Revises: 002
Create Date: 2024-01-15 10:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import sqlite

# revision identifiers, used by Alembic.
revision = '003'
down_revision = '002'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Create ai_request_logs table."""
    op.create_table(
        'ai_request_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('request_type', sa.String(50), nullable=False),
        sa.Column('model_used', sa.String(100), nullable=True),
        sa.Column('input_tokens', sa.Integer(), nullable=True),
        sa.Column('output_tokens', sa.Integer(), nullable=True),
        sa.Column('total_cost_usd', sa.Float(), nullable=True),
        sa.Column('response_time_ms', sa.Float(), nullable=True),
        sa.Column('status', sa.String(20), nullable=False, server_default='success'),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('request_payload', sqlite.JSON(), nullable=True),
        sa.Column('response_payload', sqlite.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now(), onupdate=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('idx_ai_request_logs_user_id', 'ai_request_logs', ['user_id'])
    op.create_index('idx_ai_request_logs_request_type', 'ai_request_logs', ['request_type'])
    op.create_index('idx_ai_request_logs_created_at', 'ai_request_logs', ['created_at'])


def downgrade() -> None:
    """Drop ai_request_logs table."""
    op.drop_index('idx_ai_request_logs_created_at', table_name='ai_request_logs')
    op.drop_index('idx_ai_request_logs_request_type', table_name='ai_request_logs')
    op.drop_index('idx_ai_request_logs_user_id', table_name='ai_request_logs')
    op.drop_table('ai_request_logs')