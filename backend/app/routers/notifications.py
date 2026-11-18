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
    has_brevo = bool(settings.BREVO_API_KEY.strip() or gw_doc.get("brevoApiKey"))
    has_resend = bool(settings.RESEND_API_KEY.strip() or gw_doc.get("resendApiKey"))
    
    brevo_sender_email = (
        gw_doc.get("brevoSenderEmail") or
        settings.BREVO_SENDER_EMAIL or
        settings.SMTP_FROM_EMAIL or
        settings.SMTP_USER
    )
    brevo_sender_name = (
        gw_doc.get("brevoSenderName") or
        settings.BREVO_SENDER_NAME or
        settings.SMTP_FROM_NAME
    )
    
    active_provider = "brevo" if has_brevo else ("resend" if has_resend else "smtp")

    smtp_host = gw_doc.get("smtpHost") or settings.SMTP_HOST
    smtp_port = gw_doc.get("smtpPort") or settings.SMTP_PORT
    smtp_user = gw_doc.get("smtpUser") or settings.SMTP_USER

    return {
        "hasBrevo": has_brevo,
        "hasResend": has_resend,
        "activeProvider": active_provider,
        "brevoApiKeyMasked": f"xkeysib-...{gw_doc.get('brevoApiKey', '')[-4:]}" if gw_doc.get("brevoApiKey") else ("configured via env" if settings.BREVO_API_KEY else ""),
        "brevoSenderEmail": brevo_sender_email,
        "brevoSenderName": brevo_sender_name,
        "resendApiKeyMasked": f"re_...{gw_doc.get('resendApiKey', '')[-4:]}" if gw_doc.get("resendApiKey") else ("configured via env" if settings.RESEND_API_KEY else ""),
        "smtpHost": smtp_host,
        "smtpPort": smtp_port,
        "smtpUser": smtp_user,
        "smtpPasswordMasked": f"...{gw_doc.get('smtpPassword', '')[-4:]}" if gw_doc.get("smtpPassword") else ("configured" if settings.SMTP_PASSWORD else ""),
    }

@router.post("/gateway")
async def save_email_gateway(payload: dict, current_user: dict = Depends(get_current_user)):
    brevo_key = payload.get("brevoApiKey", "").strip()
    brevo_sender_email = payload.get("brevoSenderEmail", "").strip()
    brevo_sender_name = payload.get("brevoSenderName", "").strip()
    resend_key = payload.get("resendApiKey", "").strip()
    preferred_provider = payload.get("preferredProvider", "brevo").strip()
    
    update_doc = {
        "updatedBy": current_user["_id"],
        "preferredProvider": preferred_provider
    }
    if brevo_key:
        update_doc["brevoApiKey"] = brevo_key
    if brevo_sender_email:
        update_doc["brevoSenderEmail"] = brevo_sender_email
    if brevo_sender_name:
        update_doc["brevoSenderName"] = brevo_sender_name
    if resend_key:
        update_doc["resendApiKey"] = resend_key
    if "smtpHost" in payload and payload["smtpHost"].strip():
        update_doc["smtpHost"] = payload["smtpHost"].strip()
    if "smtpPort" in payload:
        try:
            update_doc["smtpPort"] = int(payload["smtpPort"])
        except (ValueError, TypeError):
            pass
    if "smtpUser" in payload and payload["smtpUser"].strip():
        update_doc["smtpUser"] = payload["smtpUser"].strip()
    if "smtpPassword" in payload and payload["smtpPassword"].strip():
        update_doc["smtpPassword"] = payload["smtpPassword"].strip()

    await get_col("system_settings").update_one(
        {"_id": "email_gateway"},
        {"$set": update_doc},
        upsert=True
    )
    return {
        "status": "success",
        "message": "Brevo & Email HTTPS gateway settings saved successfully",
        "provider": preferred_provider
    }
