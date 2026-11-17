import uuid
import logging
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from app.models.user import (
    UserCreate, UserLogin, UserResponse, UserUpdate, TokenResponse,
    ForgotPasswordRequest, ResetPasswordRequest, DEFAULT_AVATAR
)
from app.utils.security import hash_password, verify_password, create_access_token
from app.utils.dependencies import get_current_user
from app.repository import get_col
from app.services.email_service import send_password_reset_code, send_welcome_email

logger = logging.getLogger("chronos.auth")

router = APIRouter(prefix="/auth", tags=["Authentication & Profile"])

@router.post("/register", response_model=TokenResponse)
async def register(data: UserCreate):
    users_col = get_col("users")
    existing = await users_col.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A workspace with this email address already exists"
        )
    
    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    user_doc = {
        "_id": user_id,
        "email": data.email.lower(),
        "name": data.name.strip() if data.name else "Alex Sterling",
        "hashed_password": hash_password(data.password),
        "role": "Lead Systems Architect",
        "timezone": "Africa/Kigali (CAT)",
        "timeFormat": "24h",
        "avatar": "",
        "bgImage": "",
        "emailDigest": True,
        "emailTime": "08:00",
        "reportFrequency": "daily",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    await users_col.insert_one(user_doc)
    
    token = create_access_token({"sub": user_id, "email": user_doc["email"]})
    
    user_resp = UserResponse(
        id=user_id,
        email=user_doc["email"],
        name=user_doc["name"],
        role=user_doc["role"],
        timezone=user_doc["timezone"],
        timeFormat=user_doc["timeFormat"],
        avatar=user_doc.get("avatar") or "",
        bgImage=user_doc["bgImage"],
        emailDigest=user_doc["emailDigest"],
        emailTime=user_doc["emailTime"],
        reportFrequency=user_doc["reportFrequency"],
        createdAt=user_doc["createdAt"]
    )

    # Dispatch onboarding welcome email asynchronously in background task (non-blocking)
    import asyncio
    asyncio.create_task(send_welcome_email(user_doc["email"], user_doc["name"]))

    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@router.post("/forgot-password")
async def forgot_password(data: ForgotPasswordRequest):
    users_col = get_col("users")
    user = await users_col.find_one({"email": data.email.lower()})
    if not user:
        if data.email.lower() == "alex.sterling@devmatrix.io":
            await register(UserCreate(
                name="Alex Sterling",
                email="alex.sterling@devmatrix.io",
                password="chronos2026password"
            ))
            user = await users_col.find_one({"email": data.email.lower()})
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email address"
            )
    
    # Generate 6-digit recovery code
    recovery_code = f"{uuid.uuid4().int % 900000 + 100000}"
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    
    await users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "reset_code": recovery_code,
            "reset_code_expires": expires_at
        }}
    )
    
    logger.info(f"Password reset code generated for {data.email.lower()}: {recovery_code}")

    # Dispatch real email via Gmail SMTP
    try:
        await send_password_reset_code(data.email.lower(), user.get("name", "User"), recovery_code)
    except Exception as e:
        logger.warning(f"Password recovery email dispatch skipped: {e}")
    
    return {
        "status": "success",
        "message": f"A 6-digit recovery code has been sent to {data.email}. Please check your inbox or spam folder."
    }

@router.post("/reset-password")
async def reset_password(data: ResetPasswordRequest):
    users_col = get_col("users")
    user = await users_col.find_one({"email": data.email.lower()})
    if not user:
        if data.email.lower() == "alex.sterling@devmatrix.io":
            await register(UserCreate(
                name="Alex Sterling",
                email="alex.sterling@devmatrix.io",
                password="chronos2026password"
            ))
            user = await users_col.find_one({"email": data.email.lower()})
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No account found with this email address"
            )
        
    stored_code = user.get("reset_code")
    code_expires = user.get("reset_code_expires")
    
    if not stored_code or stored_code != data.code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or incorrect recovery code"
        )
        
    if code_expires and datetime.utcnow() > code_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Recovery code has expired. Please request a new code."
        )
        
    new_hash = hash_password(data.new_password)
    await users_col.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "hashed_password": new_hash,
                "updatedAt": datetime.utcnow()
            },
            "$unset": {
                "reset_code": "",
                "reset_code_expires": ""
            }
        }
    )
    
    return {
        "status": "success",
        "message": "Password updated successfully! You can now log into your workspace."
    }

@router.post("/login", response_model=TokenResponse)
async def login(data: UserLogin):
    users_col = get_col("users")
    user = await users_col.find_one({"email": data.email.lower()})
    
    if not user:
        # If default demo email, create it dynamically
        if data.email.lower() == "alex.sterling@devmatrix.io":
            return await register(UserCreate(
                name="Alex Sterling",
                email="alex.sterling@devmatrix.io",
                password=data.password if len(data.password) >= 6 else "chronos2026"
            ))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password credentials"
        )
        
    if "hashed_password" in user:
        if not verify_password(data.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password credentials"
            )
            
    user_id = user["_id"]
    token = create_access_token({"sub": user_id, "email": user["email"]})
    
    user_resp = UserResponse(
        id=user_id,
        email=user["email"],
        name=user.get("name", "Alex Sterling"),
        role=user.get("role", "Lead Systems Architect"),
        timezone=user.get("timezone", "Africa/Kigali (CAT)"),
        timeFormat=user.get("timeFormat", "24h"),
        avatar=user.get("avatar") or "",
        bgImage=user.get("bgImage") or "",
        emailDigest=user.get("emailDigest", True),
        emailTime=user.get("emailTime", "08:00"),
        reportFrequency=user.get("reportFrequency", "daily"),
        createdAt=user.get("createdAt")
    )
    return TokenResponse(access_token=token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    return UserResponse(
        id=user_id,
        email=current_user.get("email", "alex.sterling@devmatrix.io"),
        name=current_user.get("name", "Alex Sterling"),
        role=current_user.get("role", "Lead Systems Architect"),
        timezone=current_user.get("timezone", "Africa/Kigali (CAT)"),
        timeFormat=current_user.get("timeFormat", "24h"),
        avatar=current_user.get("avatar") or "",
        bgImage=current_user.get("bgImage") or "",
        emailDigest=current_user.get("emailDigest", True),
        emailTime=current_user.get("emailTime", "08:00"),
        reportFrequency=current_user.get("reportFrequency", "daily"),
        createdAt=current_user.get("createdAt")
    )

@router.post("/upload-avatar")
async def upload_avatar(data: dict, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    users_col = get_col("users")
    avatar_data = data.get("avatar") or data.get("avatar_data") or ""
    
    # Enforce maximum image upload size of 1MB (base64 string is ~1.33x binary size)
    if len(avatar_data) > 1_500_000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image size exceeds 1MB limit. Please upload an image under 1MB."
        )
    
    avatar_url = avatar_data
    
    # Cloudinary Integration
    if settings.CLOUDINARY_API_KEY and avatar_data.startswith("data:image"):
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post(
                    f"https://api.cloudinary.com/v1_1/{settings.CLOUDINARY_CLOUD_NAME}/image/upload",
                    data={
                        "file": avatar_data,
                        "upload_preset": settings.CLOUDINARY_UPLOAD_PRESET,
                        "api_key": settings.CLOUDINARY_API_KEY
                    }
                )
                if res.status_code == 200:
                    cloudinary_res = res.json()
                    avatar_url = cloudinary_res.get("secure_url", avatar_url)
                    logger.info(f"Cloudinary upload succeeded: {avatar_url}")
        except Exception as e:
            logger.warning(f"Cloudinary upload skipped or fallback applied: {e}")
            
    # Persist avatar URL directly into MongoDB Atlas
    await users_col.update_one(
        {"_id": user_id},
        {"$set": {"avatar": avatar_url, "updatedAt": datetime.utcnow()}}
    )
    return {"status": "success", "avatar": avatar_url}

@router.put("/profile", response_model=UserResponse)
async def update_profile(data: UserUpdate, current_user: dict = Depends(get_current_user)):
    users_col = get_col("users")
    user_id = current_user["_id"]
    
    update_data = {k: v for k, v in data.dict(exclude_unset=True).items() if v is not None}
    update_data["updatedAt"] = datetime.utcnow()
    
    await users_col.update_one({"_id": user_id}, {"$set": update_data})
    updated = await users_col.find_one({"_id": user_id}) or current_user
    updated.update(update_data)
    
    return UserResponse(
        id=user_id,
        email=updated.get("email", "alex.sterling@devmatrix.io"),
        name=updated.get("name", "Alex Sterling"),
        role=updated.get("role", "Lead Systems Architect"),
        timezone=updated.get("timezone", "Africa/Kigali (CAT)"),
        timeFormat=updated.get("timeFormat", "24h"),
        avatar=updated.get("avatar") or "",
        bgImage=updated.get("bgImage") or "",
        emailDigest=updated.get("emailDigest", True),
        emailTime=updated.get("emailTime", "08:00"),
        reportFrequency=updated.get("reportFrequency", "daily"),
        createdAt=updated.get("createdAt")
    )

@router.get("/export-backup")
async def export_backup(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks = await get_col("tasks").find({"userId": user_id}).to_list(1000)
    routines = await get_col("routines").find({"userId": user_id}).to_list(1000)
    notes = await get_col("notes").find({"userId": user_id}).to_list(1000)
    
    for item in tasks + routines + notes:
        item["id"] = item.get("_id")
        
    return {
        "user": current_user,
        "tasks": tasks,
        "routines": routines,
        "notes": notes,
        "exportedAt": datetime.utcnow().isoformat()
    }

@router.post("/reset-data")
async def reset_demo_data(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks_col = get_col("tasks")
    routines_col = get_col("routines")
    notes_col = get_col("notes")
    
    # Remove all items for this user
    await tasks_col.delete_many({"userId": user_id})
    await routines_col.delete_many({"userId": user_id})
    await notes_col.delete_many({"userId": user_id})
    return {"status": "success", "message": "All workspace data cleared successfully"}
