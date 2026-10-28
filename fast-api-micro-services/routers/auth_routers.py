import os
from datetime import datetime, timedelta, timezone

import bcrypt
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from api_clients import ApiClient
from database import get_db
from schemas.auth_schema import TokenRequest, TokenResponse
from utils.response import APIResponse

load_dotenv()

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/token", response_model=APIResponse[TokenResponse])
async def get_token(payload: TokenRequest, db: Session = Depends(get_db)):
    client = db.query(ApiClient).filter(ApiClient.api_key == payload.api_key).first()

    if not client or not client.is_active:
        raise HTTPException(status_code=401, detail="api_key invalide ou inactive")

    if not bcrypt.checkpw(payload.api_secret.encode(), client.api_secret_hash.encode()):
        raise HTTPException(status_code=401, detail="api_secret invalide")

    expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    token = jwt.encode(
        {"sub": payload.api_key, "exp": expire},
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )

    return APIResponse.ok(TokenResponse(token=token))
