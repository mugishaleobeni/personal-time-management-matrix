from fastapi import APIRouter, Depends
from app.models.notification import NotificationSettingsUpdate, DigestDispatchResponse
from app.utils.dependencies import get_current_user
from app.repository import get_col
from app.services.email_service import dispatch_digest_email

router = APIRouter(prefix="/notifications", tags=["Automated Intelligence & Alerts"])

@router.get("/settings")
async def get_notification_settings(current_user: dict = Depends(get_current_user)):
    return {
        "emailDigest": current_user.get("emailDigest", True),
        "emailTime": current_user.get("emailTime", "08:00"),
        "reportFrequency": current_user.get("reportFrequency", "daily"),
        "recipientEmail": current_user.get("email", "alex.sterling@devmatrix.io")
    }

@router.put("/settings")
async def update_notification_settings(body: NotificationSettingsUpdate, current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    users_col = get_col("users")
    
    update_data = {k: v for k, v in body.dict(exclude_unset=True).items() if v is not None}
    await users_col.update_one({"_id": user_id}, {"$set": update_data})
    
    return {
        "status": "success",
        "message": "Notification preferences updated",
        "settings": update_data
    }

@router.post("/send-digest", response_model=DigestDispatchResponse)
async def trigger_digest_dispatch(current_user: dict = Depends(get_current_user)):
    user_id = current_user["_id"]
    tasks = await get_col("tasks").find({"userId": user_id}).to_list(1000)
    routines = await get_col("routines").find({"userId": user_id}).to_list(1000)
    
    result = await dispatch_digest_email(current_user, tasks, routines)
    return DigestDispatchResponse(**result)

@router.get("/gateway")
async def get_email_gateway(current_user: dict = Depends(get_current_user)):
    from app.config import settings
    gw_doc = await get_col("system_settings").find_one({"_id": "email_gateway"}) or {}
    has_resend = bool(settings.RESEND_API_KEY.strip() or gw_doc.get("resendApiKey"))
    has_brevo = bool(settings.BREVO_API_KEY.strip() or gw_doc.get("brevoApiKey"))
    return {
        "hasResend": has_resend,
        "hasBrevo": has_brevo,
        "resendApiKeyMasked": f"re_...{gw_doc.get('resendApiKey', '')[-4:]}" if gw_doc.get("resendApiKey") else ("configured" if settings.RESEND_API_KEY else ""),
        "brevoApiKeyMasked": f"...{gw_doc.get('brevoApiKey', '')[-4:]}" if gw_doc.get("brevoApiKey") else ("configured" if settings.BREVO_API_KEY else ""),
    }

@router.post("/gateway")
async def save_email_gateway(payload: dict, current_user: dict = Depends(get_current_user)):
    resend_key = payload.get("resendApiKey", "").strip()
    brevo_key = payload.get("brevoApiKey", "").strip()
    
    await get_col("system_settings").update_one(
        {"_id": "email_gateway"},
        {"$set": {"resendApiKey": resend_key, "brevoApiKey": brevo_key, "updatedBy": current_user["_id"]}},
        upsert=True
    )
    return {"status": "success", "message": "Email HTTPS API gateway credentials saved to database"}
