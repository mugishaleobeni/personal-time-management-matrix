import io
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

def generate_productivity_pdf(user: Dict[str, Any], tasks: List[Dict[str, Any]], routines: List[Dict[str, Any]]) -> io.BytesIO:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontSize=22,
        leading=26,
        textColor=colors.HexColor('#064e3b'),
        fontName='Helvetica-Bold'
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#059669'),
        fontName='Helvetica'
    )
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#065f46'),
        spaceBefore=14,
        spaceAfter=6,
        fontName='Helvetica-Bold'
    )
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['Normal'],
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#1f2937'),
        fontName='Helvetica'
    )

    elements = []

    # Title & Metadata
    elements.append(Paragraph("MASTER YOUR TIME • PRODUCTIVITY DOSSIER", title_style))
    elements.append(Paragraph(
        f"Generated for: <b>{user.get('name', 'Alex Sterling')}</b> ({user.get('role', 'Lead Systems Architect')}) | "
        f"Date: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}",
        subtitle_style
    ))
    elements.append(Spacer(1, 15))

    # Metrics Summary Table
    completed_tasks = [t for t in tasks if t.get('status') == 'Completed']
    pending_tasks = [t for t in tasks if t.get('status') != 'Completed']
    completed_routines = [r for r in routines if r.get('completed')]
    total_time_seconds = sum(t.get('timeSpentSeconds', 0) for t in tasks)
    focus_hours = round(total_time_seconds / 3600, 1)

    score = 0
    if tasks:
        score += int((len(completed_tasks) / len(tasks)) * 60)
    if routines:
        score += int((len(completed_routines) / len(routines)) * 40)
    score = min(100, score)

    metrics_data = [
        ["Productivity Score", "Focus Tracked", "Tasks Completed", "Active Habits"],
        [f"{score}%", f"{focus_hours} hrs", f"{len(completed_tasks)} / {len(tasks)}", f"{len(completed_routines)} / {len(routines)}"]
    ]
    metrics_table = Table(metrics_data, colWidths=[130, 130, 130, 130])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#064e3b')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('TOPPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#ecfdf5')),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#065f46')),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 12),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#a7f3d0'))
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 15))

    # Tasks Table
    elements.append(Paragraph("Current Priority Tasks", h2_style))
    tasks_data = [["Title", "Category", "Priority", "Status", "Time Spent"]]
    for t in tasks[:8]:
        hrs = t.get('timeSpentSeconds', 0) // 3600
        mins = (t.get('timeSpentSeconds', 0) % 3600) // 60
        time_str = f"{hrs}h {mins}m" if hrs > 0 else f"{mins}m"
        tasks_data.append([
            Paragraph(t.get('title', 'Task'), body_style),
            t.get('category', 'Work'),
            t.get('priority', 'Medium'),
            t.get('status', 'Not Started'),
            time_str
        ])
    tasks_table = Table(tasks_data, colWidths=[220, 80, 70, 80, 70])
    tasks_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#059669')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5'))
    ]))
    elements.append(tasks_table)
    elements.append(Spacer(1, 15))

    # Routines Table
    elements.append(Paragraph("Daily Habits & Routines Consistency", h2_style))
    routines_data = [["Habit", "Period", "Scheduled", "Duration", "Streak", "Done Today"]]
    for r in routines[:8]:
        routines_data.append([
            Paragraph(r.get('title', 'Habit'), body_style),
            r.get('period', 'Morning'),
            r.get('time', '06:00'),
            f"{r.get('duration', 30)}m",
            f"{r.get('streak', 0)} days",
            "YES" if r.get('completed') else "NO"
        ])
    routines_table = Table(routines_data, colWidths=[200, 70, 60, 60, 65, 65])
    routines_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#047857')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('TOPPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#d1fae5'))
    ]))
    elements.append(routines_table)

    doc.build(elements)
    buffer.seek(0)
    return buffer
