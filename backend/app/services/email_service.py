import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("chronos.email")

def _send_smtp_sync(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: Optional[str] = None,
    host: Optional[str] = None,
    port: Optional[int] = None,
    user: Optional[str] = None,
    pwd: Optional[str] = None,
    from_addr: Optional[str] = None,
    from_name: Optional[str] = None
) -> bool:
    """Synchronous SMTP mail delivery with multi-port fallback (supports 587, 2525, 465)."""
    smtp_host = (host or settings.SMTP_HOST).strip()
    try:
        smtp_port = int(port or settings.SMTP_PORT)
    except (ValueError, TypeError):
        smtp_port = 587
    smtp_user = (user or settings.SMTP_USER).strip()
    smtp_pwd = (pwd or settings.email_password).strip()
    smtp_from = (from_addr or settings.SMTP_FROM_EMAIL.strip() or smtp_user).strip()
    smtp_name = (from_name or settings.SMTP_FROM_NAME).strip()
    
    if not smtp_user or not smtp_pwd:
        logger.warning("SMTP credentials not configured. Email skipped.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{smtp_name} <{smtp_from}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    if html_content:
        msg.attach(MIMEText(html_content, "html", "utf-8"))

    # Multi-port cascade: try configured port first, then alternative ports (e.g. Brevo 587, 2525 & 465)
    candidate_ports = [smtp_port]
    if "brevo" in smtp_host.lower():
        for alt_port in [587, 2525, 465]:
            if alt_port not in candidate_ports:
                candidate_ports.append(alt_port)
    elif 465 not in candidate_ports:
        candidate_ports.append(465)

    for current_port in candidate_ports:
        try:
            if current_port == 465:
                with smtplib.SMTP_SSL(smtp_host, 465, timeout=8) as ssl_server:
                    ssl_server.login(smtp_user, smtp_pwd)
                    ssl_server.sendmail(smtp_from, [to_email], msg.as_string())
                logger.info(f"Successfully delivered email '{subject}' to {to_email} via {smtp_host}:{current_port} (SSL)")
                return True
            else:
                with smtplib.SMTP(smtp_host, current_port, timeout=8) as server:
                    server.ehlo()
                    server.starttls()
                    server.ehlo()
                    server.login(smtp_user, smtp_pwd)
                    server.sendmail(smtp_from, [to_email], msg.as_string())
                logger.info(f"Successfully delivered email '{subject}' to {to_email} via {smtp_host}:{current_port} (STARTTLS)")
                return True
        except Exception as e_port:
            logger.warning(f"SMTP delivery via {smtp_host}:{current_port} encountered issue: {e_port}")

    return False

async def send_email_with_provider(
    to_email: str,
    subject: str,
    text_content: str,
    html_content: Optional[str] = None
) -> tuple[bool, str]:
    """Dispatches email prioritizing Brevo HTTPS REST API (port 443), with fallback to Resend and SMTP."""
    brevo_key = settings.BREVO_API_KEY.strip()
    brevo_sender_email = settings.BREVO_SENDER_EMAIL.strip() or settings.SMTP_FROM_EMAIL.strip() or settings.SMTP_USER.strip()
    brevo_sender_name = settings.BREVO_SENDER_NAME.strip() or settings.SMTP_FROM_NAME.strip() or "Master Your Time"
    resend_key = settings.RESEND_API_KEY.strip()

    # Dynamic lookup: Check if user configured an email gateway in MongoDB Atlas
    gw_doc = None
    try:
        from app.repository import get_col
        gw_doc = await get_col("system_settings").find_one({"_id": "email_gateway"})
        if gw_doc:
            if gw_doc.get("brevoApiKey"):
                brevo_key = gw_doc.get("brevoApiKey").strip()
            if gw_doc.get("brevoSenderEmail"):
                brevo_sender_email = gw_doc.get("brevoSenderEmail").strip()
            if gw_doc.get("brevoSenderName"):
                brevo_sender_name = gw_doc.get("brevoSenderName").strip()
            if gw_doc.get("resendApiKey"):
                resend_key = gw_doc.get("resendApiKey").strip()
    except Exception as e_lookup:
        logger.debug(f"Could not load email gateway from database: {e_lookup}")

    # Fallback to Brevo password key if it looks like an API key
    if not brevo_key and (settings.SMTP_PASSWORD.startswith("xkeysib-") or settings.SMTP_PASSWORD.startswith("xsmtpsib-")):
        brevo_key = settings.SMTP_PASSWORD.strip()

    # Ensure a valid sender email fallback
    if not brevo_sender_email:
        brevo_sender_email = settings.BREVO_SENDER_EMAIL.strip() or settings.SMTP_FROM_EMAIL.strip() or "mugishaleobeni0@gmail.com"

    # =========================================================================
    # 1. PRIMARY PROVIDER: Brevo (Sendinblue) HTTPS REST API (Port 443)
    # 300 free emails/day, never blocked by Render, AWS, or ISP firewalls
    # =========================================================================
    if brevo_key:
        try:
            import httpx
            headers = {
                "api-key": brevo_key,
                "Content-Type": "application/json",
                "Accept": "application/json"
            }
            payload = {
                "sender": {
                    "name": brevo_sender_name,
                    "email": brevo_sender_email
                },
                "to": [{"email": to_email}],
                "subject": subject,
                "htmlContent": html_content or text_content,
                "textContent": text_content
            }
            async with httpx.AsyncClient(timeout=10.0) as client:
                res = await client.post("https://api.brevo.com/v3/smtp/email", headers=headers, json=payload)
                if res.status_code in [200, 201, 202]:
                    resp_data = res.json() if res.content else {}
                    msg_id = resp_data.get("messageId", "ok")
                    logger.info(f"Delivered email '{subject}' to {to_email} via Brevo HTTPS API (id: {msg_id})")
                    return True, "brevo"
                else:
                    logger.warning(f"Brevo HTTPS dispatch failed ({res.status_code}): {res.text}")
        except Exception as e_brevo:
            logger.warning(f"Brevo HTTPS dispatch encountered error: {e_brevo}")

    # =========================================================================
    # 2. SECONDARY HTTPS GATEWAY: Resend API (Port 443)
    # =========================================================================
    if resend_key:
        try:
            import httpx
            async with httpx.AsyncClient(timeout=8.0) as client:
                res = await client.post(
                    "https://api.resend.com/emails",
                    headers={
                        "Authorization": f"Bearer {resend_key}",
                        "Content-Type": "application/json"
                    },
                    json={
                        "from": f"{settings.SMTP_FROM_NAME} <onboarding@resend.dev>",
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content or text_content,
                        "text": text_content
                    }
                )
                if res.status_code in [200, 201]:
                    logger.info(f"Delivered email '{subject}' to {to_email} via Resend HTTPS API")
                    return True, "resend"
                else:
                    logger.warning(f"Resend HTTPS dispatch failed ({res.status_code}): {res.text}")
        except Exception as e_resend:
            logger.warning(f"Resend HTTPS error: {e_resend}")

    # =========================================================================
    # 3. DIRECT SMTP RELAY (Brevo SMTP or Gmail SMTP with multi-port fallback)
    # =========================================================================
    smtp_host = (gw_doc.get("smtpHost") if gw_doc else "") or settings.SMTP_HOST
    smtp_port = (gw_doc.get("smtpPort") if gw_doc else "") or settings.SMTP_PORT
    smtp_user = (gw_doc.get("smtpUser") if gw_doc else "") or settings.SMTP_USER
    smtp_pwd = (gw_doc.get("smtpPassword") if gw_doc else "") or settings.email_password
    smtp_from = (gw_doc.get("smtpFromEmail") if gw_doc else "") or settings.SMTP_FROM_EMAIL
    smtp_name = (gw_doc.get("smtpFromName") if gw_doc else "") or settings.SMTP_FROM_NAME

    smtp_success = await asyncio.to_thread(
        _send_smtp_sync,
        to_email,
        subject,
        text_content,
        html_content,
        smtp_host,
        smtp_port,
        smtp_user,
        smtp_pwd,
        smtp_from,
        smtp_name
    )
    if smtp_success:
        provider_name = "brevo_smtp" if "brevo" in smtp_host.lower() else "smtp"
        return True, provider_name

    return False, "failed"

async def send_email_async(to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
    """Dispatches email via configured provider and returns boolean success status."""
    delivered, _ = await send_email_with_provider(to_email, subject, text_content, html_content)
    return delivered

async def send_password_reset_code(to_email: str, name: str, code: str) -> bool:
    """Dispatches a password reset email with the 6-digit verification code."""
    subject = f"Master Your Time: Password Recovery Code [{code}]"
    text_content = f"""Hello {name},

You requested a password reset for your Master Your Time account.

Your 6-digit recovery code is: {code}

This code will expire in 30 minutes. If you did not initiate this request, you can safely ignore this email.

— Master Your Time Security Team"""

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #08130e; color: #f1f5f9; padding: 24px; margin: 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #0e1c14; border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #34d399; font-size: 24px; font-weight: 800; margin: 0;">MASTER YOUR TIME</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Personal Productivity & Time Architecture</p>
        </div>
        <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 12px;">Password Recovery Request</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Hello <strong>{name}</strong>,<br>
          We received a request to reset your password. Use the verification code below to authorize the update:
        </p>
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(52, 211, 153, 0.4); border-radius: 14px; padding: 18px; text-align: center; margin: 24px 0;">
          <div style="font-size: 11px; font-weight: 700; color: #34d399; text-transform: uppercase; letter-spacing: 2px;">Verification Code</div>
          <div style="font-size: 32px; font-weight: 900; color: #ffffff; letter-spacing: 6px; font-family: monospace; margin-top: 6px;">{code}</div>
        </div>
        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5;">
          This single-use code expires in <strong>30 minutes</strong>.<br>
          If you did not request this code, no action is required and your account remains secure.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b;">
          Master Your Time • Kigali (CAT)
        </div>
      </div>
    </body>
    </html>
    """
    return await send_email_async(to_email, subject, text_content, html_content)

async def send_welcome_email(to_email: str, name: str) -> bool:
    """Dispatches an onboarding welcome email upon account registration."""
    subject = "Welcome to Master Your Time • Workspace Initialized"
    text_content = f"""Hello {name},

Welcome to Master Your Time! Your personal productivity workspace has been initialized successfully.

Sign into your workspace anytime to plan daily matrix schedules, track focus timers, and monitor daily rituals.

— Master Your Time Team"""
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #08130e; color: #f1f5f9; padding: 24px; margin: 0;">
      <div style="max-width: 480px; margin: 0 auto; background: #0e1c14; border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #34d399; font-size: 24px; font-weight: 800; margin: 0;">MASTER YOUR TIME</h1>
          <p style="color: #94a3b8; font-size: 13px; margin-top: 4px;">Welcome to Your Workspace</p>
        </div>
        <h2 style="font-size: 18px; color: #ffffff; margin-bottom: 12px;">Welcome, {name}!</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #cbd5e1;">
          Your high-velocity personal time management system is ready. Organize priority tasks, flow through focus sessions, and maintain 14-day daily rituals with absolute focus.
        </p>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 24px; padding-top: 16px; text-align: center; font-size: 11px; color: #64748b;">
          Master Your Time • Production Verified
        </div>
      </div>
    </body>
    </html>
    """
    return await send_email_async(to_email, subject, text_content, html_content)

def generate_digest_content(user: Dict[str, Any], tasks: List[Dict[str, Any]], routines: List[Dict[str, Any]]) -> Dict[str, Any]:
    due_today = [t for t in tasks if t.get('status') != 'Completed']
    completed_habits = [r for r in routines if r.get('completed')]
    
    body = (
        f"Good morning, {user.get('name', 'Alex')}!\n\n"
        f"Here is your Master Your Time Automated Daily Briefing for {datetime.utcnow().strftime('%A, %B %d, %Y')}:\n\n"
        f"📋 Active Priority Tasks: {len(due_today)}\n"
        f"🔥 Completed Morning Habits: {len(completed_habits)} of {len(routines)}\n"
        f"🎯 Focus Time Target: 8.0 hours\n\n"
        f"Highest Priority Action Item: "
        f"'{due_today[0]['title'] if due_today else 'All priority tasks complete!'}'\n\n"
        f"— Master Your Time Automated Intelligence"
    )
    return {
        "subject": f"Master Your Time Daily Intelligence Digest • {datetime.utcnow().strftime('%b %d')}",
        "body": body,
        "recipient": user.get("email", "alex.sterling@devmatrix.io"),
        "tasksDue": len(due_today),
        "habitsDone": len(completed_habits)
    }

async def dispatch_digest_email(user: Dict[str, Any], tasks: List[Dict[str, Any]], routines: List[Dict[str, Any]]) -> Dict[str, Any]:
    digest = generate_digest_content(user, tasks, routines)
    recipient = user.get("email", "alex.sterling@devmatrix.io")
    name = user.get("name", "User")
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #08130e; color: #f1f5f9; padding: 24px; margin: 0;">
      <div style="max-width: 520px; margin: 0 auto; background: #0e1c14; border: 1px solid rgba(52, 211, 153, 0.3); border-radius: 20px; padding: 32px; box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
        <h1 style="color: #34d399; font-size: 22px; font-weight: 800; margin: 0 0 16px 0;">MASTER YOUR TIME BRIEFING</h1>
        <p style="font-size: 15px; color: #ffffff; margin-bottom: 16px;">Good day, <strong>{name}</strong>!</p>
        <p style="font-size: 13px; color: #cbd5e1; line-height: 1.6;">{digest['body'].replace(chr(10), '<br>')}</p>
        <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 24px; padding-top: 16px; font-size: 11px; color: #64748b;">
          Automated Intelligence • Master Your Time
        </div>
      </div>
    </body>
    </html>
    """
    
    sent, provider = await send_email_with_provider(recipient, digest["subject"], digest["body"], html_content)
    logger.info(f"Dispatched automated digest to {recipient} via {provider} (Sent={sent}): {digest['subject']}")
    
    return {
        "status": "success",
        "delivered": sent,
        "provider": provider,
        "recipient": recipient,
        "digestSummary": f"Dispatched daily intelligence brief ({digest['tasksDue']} pending tasks, {digest['habitsDone']} completed habits) • Delivered via {provider.upper()}={sent}",
        "tasksDueToday": digest["tasksDue"],
        "routinesCompleted": digest["habitsDone"],
        "dispatchedAt": datetime.utcnow().isoformat()
    }
