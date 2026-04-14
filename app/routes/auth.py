from typing import Annotated
import logging
import secrets
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.models.password_reset import PasswordResetToken
from app.schemas.user import UserCreate, UserResponse, UserUpdate, PasswordChange
from app.schemas.auth import Token, LoginRequest
from app.services.auth_service import AuthService, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()
auth_service = AuthService()


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    """Register a new user with email and password."""
    try:
        existing_user = db.query(User).filter(User.email == user_data.email).first()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered. Please use a different email or login.",
            )

        existing_username = db.query(User).filter(User.username == user_data.username).first()
        if existing_username:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken. Please choose a different username.",
            )

        hashed_password = auth_service.hash_password(user_data.password)

        new_user = User(
            email=user_data.email,
            username=user_data.username,
            hashed_password=hashed_password,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            is_active=True,
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        logger.info(f"New user registered: {new_user.email} (ID: {new_user.id})")

        access_token = auth_service.create_access_token(
            data={"sub": str(new_user.id), "email": new_user.email}
        )
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(new_user.id), "email": new_user.email}
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error during user registration: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register user. Please try again later.",
        )


@router.post("/login", response_model=Token)
async def login(
    credentials: LoginRequest,
    db: Annotated[Session, Depends(get_db)],
) -> Token:
    """Authenticate user with email and password."""
    try:
        user = db.query(User).filter(User.email == credentials.email).first()

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is deactivated. Please contact support.",
            )

        if not auth_service.verify_password(credentials.password, user.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        logger.info(f"User logged in: {user.email} (ID: {user.id})")

        access_token = auth_service.create_access_token(
            data={"sub": str(user.id), "email": user.email}
        )
        refresh_token = auth_service.create_refresh_token(
            data={"sub": str(user.id), "email": user.email}
        )

        return Token(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.access_token_expire_minutes * 60,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during user login: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication failed. Please try again later.",
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: Annotated[User, Depends(get_current_user)]) -> UserResponse:
    """Return the currently authenticated user's profile."""
    return current_user


@router.put("/me", response_model=UserResponse)
async def update_profile(
    updates: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    """Update the currently authenticated user's profile."""
    if updates.first_name is not None:
        current_user.first_name = updates.first_name
    if updates.last_name is not None:
        current_user.last_name = updates.last_name
    if updates.skills is not None:
        current_user.skills = updates.skills
    if updates.username is not None:
        existing = db.query(User).filter(
            User.username == updates.username, User.id != current_user.id
        ).first()
        if existing:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Username already taken")
        current_user.username = updates.username
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password")
async def change_password(
    data: PasswordChange,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Change the current user's password."""
    if not auth_service.verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    current_user.hashed_password = auth_service.hash_password(data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# ── Forgot / Reset password ───────────────────────────────────────────────────

class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


RESET_TOKEN_EXPIRE_MINUTES = 30


@router.post("/forgot-password")
async def forgot_password(
    data: ForgotPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Generate a password-reset token for the given email.

    Always returns 200 so callers cannot enumerate registered emails.
    The reset_token is returned directly in the response for now (no email
    service configured). TODO: deliver token via email (e.g. SendGrid / Resend)
    when an email provider is added.
    """
    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        # Return a convincing success response to prevent email enumeration
        return {"message": "If this email is registered, a reset code has been sent."}

    # Invalidate any existing unused tokens for this user
    db.query(PasswordResetToken).filter(
        PasswordResetToken.user_id == user.id,
        PasswordResetToken.used == False,  # noqa: E712
    ).delete()

    token = secrets.token_urlsafe(32)
    expires_at = datetime.utcnow() + timedelta(minutes=RESET_TOKEN_EXPIRE_MINUTES)

    reset_token = PasswordResetToken(
        user_id=user.id,
        token=token,
        expires_at=expires_at,
    )
    db.add(reset_token)
    db.commit()

    logger.info(f"Password reset token generated for user {user.email}")

    # TODO: Send token via email when an email service is configured.
    # For now, return the token directly so the feature is usable without email.
    return {
        "message": "If this email is registered, a reset code has been sent.",
        "reset_token": token,         # Remove this field once email delivery is wired
        "expires_in_minutes": RESET_TOKEN_EXPIRE_MINUTES,
    }


@router.post("/reset-password")
async def reset_password(
    data: ResetPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """
    Reset a user's password using a valid reset token.
    Validates the token is unused and not expired, then updates the password.
    """
    if len(data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="New password must be at least 8 characters.",
        )

    reset_record = (
        db.query(PasswordResetToken)
        .filter(PasswordResetToken.token == data.token)
        .first()
    )

    if not reset_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset code. Please request a new one.",
        )

    if reset_record.used:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This reset code has already been used.",
        )

    if reset_record.is_expired():
        db.delete(reset_record)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset code has expired. Please request a new one.",
        )

    user = db.query(User).filter(User.id == reset_record.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset code.",
        )

    user.hashed_password = auth_service.hash_password(data.new_password)
    reset_record.used = True
    db.commit()

    logger.info(f"Password reset successfully for user {user.email}")
    return {"message": "Password reset successfully. You can now log in with your new password."}
