from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean
from datetime import datetime

from app.core.database import Base


class PasswordResetToken(Base):
    """
    Stores short-lived password reset tokens.

    Created by POST /api/auth/forgot-password.
    Consumed (and deleted) by POST /api/auth/reset-password.

    Table is created automatically by Base.metadata.create_all() on startup.
    No Alembic migration required — this is a net-new table.
    """
    __tablename__ = "password_reset_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(64), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    used = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    def is_expired(self) -> bool:
        return datetime.utcnow() > self.expires_at

    def __repr__(self) -> str:
        return f"<PasswordResetToken(user_id={self.user_id}, expires_at={self.expires_at})>"
