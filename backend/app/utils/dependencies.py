from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any
from app.utils.security import decode_access_token
from app.repository import get_col

security_bearer = HTTPBearer(auto_error=False)

async def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    users_col = get_col("users")
    
    if credentials:
        token = credentials.credentials
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]
            # Look up by id or email
            user = await users_col.find_one({"_id": user_id})
            if not user:
                user = await users_col.find_one({"email": user_id})
            if user:
                return user

    # If no bearer or token invalid, check if a default user exists
    default_user = await users_col.find_one({"email": "alex.sterling@devmatrix.io"})
    if default_user:
        return default_user
        
    # If no user at all, return placeholder demo user identity
    return {
        "_id": "default-user-alex",
        "name": "Alex Sterling",
        "email": "alex.sterling@devmatrix.io",
        "role": "Lead Systems Architect",
        "timezone": "Africa/Kigali (CAT)",
        "timeFormat": "24h",
        "avatar": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=85",
        "bgImage": "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=1600&q=85",
        "emailDigest": True,
        "emailTime": "08:00",
        "reportFrequency": "daily"
    }

async def require_auth_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security_bearer)) -> Dict[str, Any]:
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required",
            headers={"WWW-Authenticate": "Bearer"}
        )
    user = await get_current_user(credentials)
    if not user or user.get("_id") == "default-user-alex":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication session",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user
