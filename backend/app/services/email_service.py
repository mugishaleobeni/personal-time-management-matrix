import smtplib
import asyncio
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.config import settings

logger = logging.getLogger("chronos.email")

def _send_smtp_sync(to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
    """Synchronous SMTP mail delivery using configured credentials (Gmail / SMTP)."""
    user = settings.SMTP_USER.strip()
    pwd = settings.email_password.strip()
    
    if not user or not pwd:
        logger.warning("SMTP credentials not configured. Email skipped.")
        return False

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    from_addr = settings.SMTP_FROM_EMAIL.strip() or user
    msg["From"] = f"{settings.SMTP_FROM_NAME} <{from_addr}>"
    msg["To"] = to_email

    msg.attach(MIMEText(text_content, "plain", "utf-8"))
    if html_content:
        msg.attach(MIMEText(html_content, "html", "utf-8"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=12) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(user, pwd)
            server.sendmail(from_addr, [to_email], msg.as_string())
        logger.info(f"Successfully delivered email '{subject}' to {to_email}")
        return True
    except Exception as e:
        logger.warning(f"SMTP delivery to {to_email} encountered issue: {e}")
        return False

async def send_email_async(to_email: str, subject: str, text_content: str, html_content: Optional[str] = None) -> bool:
    """Asynchronous wrapper for SMTP sending to avoid blocking event loop."""
    return await asyncio.to_thread(_send_smtp_sync, to_email, subject, text_content, html_content)

async def send_password_reset_code(to_email: str, name: str, code: str) -> bool:
    """Dispatches a password reset email with the 6-digit verification code."""
    subject = f"Chronos Security: Password Recovery Code [{code}]"
    text_content = f"""Hello {name},

You requested a password reset for your Chronos Workspace account.

Your 6-digit recovery code is: {code}

This code will expire in 30 minutes. If you did not initiate this request, you can safely ignore this email.

— Chronos OS Security Team"""

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
          Chronos OS • Kigali (CAT) • One Love Architecture
        </div>
      </div>
    </body>
    </html>
    """
    return await send_email_async(to_email, subject, text_content, html_content)

async def send_welcome_email(to_email: str, name: str) -> bool:
    """Dispatches an onboarding welcome email upon account registration."""
    subject = "Welcome to Chronos OS • Workspace Initialized"
    text_content = f"""Hello {name},

Welcome to Chronos OS! Your personal productivity workspace has been initialized successfully.

Sign into your workspace anytime to plan daily matrix schedules, track focus timers, and monitor daily rituals.

— Chronos OS Team"""
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
          Chronos OS • Production Verified
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
        f"Here is your Chronos Automated Daily Briefing for {datetime.utcnow().strftime('%A, %B %d, %Y')}:\n\n"
        f"📋 Active Priority Tasks: {len(due_today)}\n"
        f"🔥 Completed Morning Habits: {len(completed_habits)} of {len(routines)}\n"
        f"🎯 Focus Time Target: 8.0 hours\n\n"
        f"Highest Priority Action Item: "
        f"'{due_today[0]['title'] if due_today else 'All priority tasks complete!'}'\n\n"
        f"— Chronos OS Automated Intelligence"
    )
    return {
        "subject": f"Chronos Daily Intelligence Digest • {datetime.utcnow().strftime('%b %d')}",
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
          Automated Intelligence • Chronos OS
        </div>
      </div>
    </body>
    </html>
    """
    
    sent = await send_email_async(recipient, digest["subject"], digest["body"], html_content)
    logger.info(f"Dispatched automated digest to {recipient} (Sent={sent}): {digest['subject']}")
    
    return {
        "status": "success",
        "recipient": recipient,
        "digestSummary": f"Dispatched daily intelligence brief ({digest['tasksDue']} pending tasks, {digest['habitsDone']} completed habits)",
        "tasksDueToday": digest["tasksDue"],
        "routinesCompleted": digest["habitsDone"],
        "dispatchedAt": datetime.utcnow().isoformat()
    }
