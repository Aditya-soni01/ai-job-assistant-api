import secrets
import logging
from typing import Annotated
from urllib.parse import urlencode

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.user import User
from app.services.auth_service import AuthService

logger = logging.getLogger(__name__)
router = APIRouter()
auth_service = AuthService()

# ── helpers ────────────────────────────────────────────────────────────────────

# FRONTEND_URL = "http://localhost:5173"
FRONTEND_URL = "https://purple-chinchilla-156551.hostingersite.com"


def _make_token_response(user: User) -> dict:
    access_token = auth_service.create_access_token(
        data={"sub": str(user.id), "email": user.email}
    )
    refresh_token = auth_service.create_refresh_token(
        data={"sub": str(user.id), "email": user.email}
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_in": settings.access_token_expire_minutes * 60,
    }


def _get_or_create_oauth_user(
    db: Session,
    *,
    email: str,
    first_name: str,
    last_name: str,
    username_hint: str,
    provider: str,
) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    # Ensure unique username
    base = username_hint.lower().replace(" ", "_")[:40]
    username = base
    counter = 1
    while db.query(User).filter(User.username == username).first():
        username = f"{base}{counter}"
        counter += 1

    user = User(
        email=email,
        username=username,
        hashed_password=auth_service.hash_password(secrets.token_urlsafe(32)),
        first_name=first_name,
        last_name=last_name,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    logger.info(f"New {provider} OAuth user created: {email} (ID: {user.id})")
    return user


# ── Google ─────────────────────────────────────────────────────────────────────

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo"


@router.get("/google")
async def google_login():
    if not settings.google_client_id:
        raise HTTPException(status_code=501, detail="Google OAuth is not configured.")
    params = {
        "client_id": settings.google_client_id,
        # "redirect_uri": f"http://localhost:8001/api/auth/oauth/google/callback",
        "redirect_uri": "https://rolegenie-backend.onrender.com/api/auth/oauth/google/callback",
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }
    return RedirectResponse(url=f"{GOOGLE_AUTH_URL}?{urlencode(params)}")


@router.get("/google/callback")
async def google_callback(
    code: str = Query(...),
    db: Session = Depends(get_db),
):
    async with httpx.AsyncClient() as client:
        # Exchange code for tokens
        token_resp = await client.post(
            GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                # "redirect_uri": f"http://localhost:8001/api/auth/oauth/google/callback",
                "redirect_uri": "https://rolegenie-backend.onrender.com/api/auth/oauth/google/callback",
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            logger.error(f"Google token exchange failed: {token_resp.text}")
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_auth_failed")

        google_token = token_resp.json()["access_token"]

        # Fetch user info
        user_resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {google_token}"},
        )
        if user_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=google_userinfo_failed")

        info = user_resp.json()

    user = _get_or_create_oauth_user(
        db,
        email=info["email"],
        first_name=info.get("given_name", ""),
        last_name=info.get("family_name", ""),
        username_hint=info.get("name", info["email"].split("@")[0]),
        provider="Google",
    )

    tokens = _make_token_response(user)
    params = urlencode(tokens)
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?{params}")


# ── GitHub ─────────────────────────────────────────────────────────────────────

GITHUB_AUTH_URL = "https://github.com/login/oauth/authorize"
GITHUB_TOKEN_URL = "https://github.com/login/oauth/access_token"
GITHUB_USER_URL = "https://api.github.com/user"
GITHUB_EMAILS_URL = "https://api.github.com/user/emails"


@router.get("/github")
async def github_login():
    if not settings.github_client_id:
        raise HTTPException(status_code=501, detail="GitHub OAuth is not configured.")
    params = {
        "client_id": settings.github_client_id,
        # "redirect_uri": f"http://localhost:8001/api/auth/oauth/github/callback",
        "redirect_uri": "https://rolegenie-backend.onrender.com/api/auth/oauth/github/callback",
        "scope": "user:email read:user",
    }
    return RedirectResponse(url=f"{GITHUB_AUTH_URL}?{urlencode(params)}")


@router.get("/github/callback")
async def github_callback(
    code: str = Query(...),
    db: Session = Depends(get_db),
):
    async with httpx.AsyncClient() as client:
        # Exchange code for access token
        token_resp = await client.post(
            GITHUB_TOKEN_URL,
            data={
                "client_id": settings.github_client_id,
                "client_secret": settings.github_client_secret,
                "code": code,
                # "redirect_uri": f"http://localhost:8001/api/auth/oauth/github/callback",
                "redirect_uri": "https://rolegenie-backend.onrender.com/api/auth/oauth/github/callback",
            },
            headers={"Accept": "application/json"},
        )
        if token_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=github_auth_failed")

        github_token = token_resp.json().get("access_token")
        if not github_token:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=github_no_token")

        headers = {"Authorization": f"Bearer {github_token}"}

        # Fetch profile
        user_resp = await client.get(GITHUB_USER_URL, headers=headers)
        if user_resp.status_code != 200:
            return RedirectResponse(f"{FRONTEND_URL}/login?error=github_userinfo_failed")

        profile = user_resp.json()

        # Fetch primary email (may be private on profile)
        email = profile.get("email")
        if not email:
            emails_resp = await client.get(GITHUB_EMAILS_URL, headers=headers)
            if emails_resp.status_code == 200:
                primary = next(
                    (e for e in emails_resp.json() if e.get("primary") and e.get("verified")),
                    None,
                )
                if primary:
                    email = primary["email"]

    if not email:
        return RedirectResponse(f"{FRONTEND_URL}/login?error=github_no_email")

    name_parts = (profile.get("name") or "").split(" ", 1)
    user = _get_or_create_oauth_user(
        db,
        email=email,
        first_name=name_parts[0] if name_parts else "",
        last_name=name_parts[1] if len(name_parts) > 1 else "",
        username_hint=profile.get("login", email.split("@")[0]),
        provider="GitHub",
    )

    tokens = _make_token_response(user)
    params = urlencode(tokens)
    return RedirectResponse(f"{FRONTEND_URL}/oauth/callback?{params}")
