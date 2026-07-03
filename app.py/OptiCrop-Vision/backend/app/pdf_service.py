import os
from io import BytesIO
import json
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

FONT_PATH = os.path.join(os.path.dirname(__file__), "fonts", "NotoSansTelugu-Regular.ttf")
HAS_TELUGU_FONT = os.path.exists(FONT_PATH)
if HAS_TELUGU_FONT:
    pdfmetrics.registerFont(TTFont('Telugu', FONT_PATH))

def _create_base_doc(buffer):
    return SimpleDocTemplate(
        buffer, 
        pagesize=letter,
        rightMargin=40, leftMargin=40,
        topMargin=40, bottomMargin=40
    )

def _get_styles(is_telugu=False):
    styles = getSampleStyleSheet()
    
    base_font = 'Telugu' if is_telugu and HAS_TELUGU_FONT else 'Helvetica'
    base_font_bold = 'Telugu' if is_telugu and HAS_TELUGU_FONT else 'Helvetica-Bold'
    
    styles['Normal'].fontName = base_font
    
    # Custom styles
    styles.add(ParagraphStyle(
        name='OptiCropTitle',
        parent=styles['Heading1'],
        fontName=base_font_bold,
        fontSize=24,
        spaceAfter=12,
        textColor=colors.HexColor("#10b981")
    ))
    
    styles.add(ParagraphStyle(
        name='SubTitle',
        parent=styles['Heading2'],
        fontName=base_font_bold,
        fontSize=14,
        spaceAfter=10,
        textColor=colors.HexColor("#475569")
    ))
    
    styles.add(ParagraphStyle(
        name='Disclaimer',
        parent=styles['Normal'],
        fontName=base_font,
        fontSize=9,
        textColor=colors.HexColor("#ef4444"),
        spaceBefore=20,
        spaceAfter=10,
        alignment=1 # Center
    ))
    
    return styles

def _clean_text(text, is_telugu):
    if not text:
        return ""
    if is_telugu and not HAS_TELUGU_FONT:
        return "[Text omitted - Telugu font missing in system]"
    return str(text)

def generate_crop_report_pdf(report, prediction, soil_data, user) -> BytesIO:
    buffer = BytesIO()
    doc = _create_base_doc(buffer)
    styles = _get_styles(is_telugu=False)
    elements = []

    # Title
    elements.append(Paragraph("OptiCrop Prediction Report", styles['OptiCropTitle']))
    elements.append(Paragraph(f"Generated for: {user.email}", styles['Normal']))
    elements.append(Paragraph(f"Date: {prediction.timestamp.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    elements.append(Spacer(1, 20))

    # Prediction Result
    elements.append(Paragraph("Crop Recommendation", styles['SubTitle']))
    result_data = [
        ["Recommended Crop", prediction.predicted_crop],
        ["Confidence Score", f"{(prediction.confidence * 100):.1f}%"]
    ]
    t = Table(result_data, colWidths=[200, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#1e293b")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1"))
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Soil Data
    elements.append(Paragraph("Soil & Environmental Data", styles['SubTitle']))
    season_map = {
        'Kharif': 'Kharif (June/July – October/November)',
        'Rabi': 'Rabi (October/November – March/April)',
        'Zaid': 'Zaid (March/April – June)',
        'Whole Year': 'Whole Year (January – December)'
    }
    env_data = [
        ["Nitrogen (N)", f"{soil_data.N} mg/kg"],
        ["Phosphorus (P)", f"{soil_data.P} mg/kg"],
        ["Potassium (K)", f"{soil_data.K} mg/kg"],
        ["Temperature", f"{soil_data.temperature} °C"],
        ["Humidity", f"{soil_data.humidity} %"],
        ["Soil pH", f"{soil_data.ph}"],
        ["Rainfall", f"{soil_data.rainfall} mm"],
        ["Season", season_map.get(soil_data.season, soil_data.season)]
    ]
    t2 = Table(env_data, colWidths=[200, 300])
    t2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#1e293b")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1"))
    ]))
    elements.append(t2)
    elements.append(Spacer(1, 20))

    # Report Summary & Action Plan
    elements.append(Paragraph("AI Advisory Summary", styles['SubTitle']))
    elements.append(Paragraph(report.summary, styles['Normal']))
    elements.append(Spacer(1, 10))
    
    # We split action plan by newline to render properly
    for line in report.action_plan.split('\n'):
        if line.strip():
            elements.append(Paragraph(line, styles['Normal']))
            elements.append(Spacer(1, 5))

    elements.append(Spacer(1, 20))

    # Disclaimer
    elements.append(Paragraph(
        "DISCLAIMER: This report is AI-assisted advisory guidance and should be verified with local agricultural experts. "
        "Estimated weather and auto-fetched rainfall may differ from exact seasonal agricultural data.", 
        styles['Disclaimer']
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer

def generate_vision_report_pdf(diagnosis, user) -> BytesIO:
    buffer = BytesIO()
    doc = _create_base_doc(buffer)
    is_telugu = (diagnosis.language.lower() == 'telugu') if diagnosis.language else False
    styles = _get_styles(is_telugu=is_telugu)
    
    base_font = 'Telugu' if is_telugu and HAS_TELUGU_FONT else 'Helvetica'
    base_font_bold = 'Telugu' if is_telugu and HAS_TELUGU_FONT else 'Helvetica-Bold'
    
    elements = []

    # Title
    elements.append(Paragraph("OptiCrop Leaf Diagnosis Report", styles['OptiCropTitle']))
    elements.append(Paragraph(f"Generated for: {user.email}", styles['Normal']))
    elements.append(Paragraph(f"Date: {diagnosis.created_at.strftime('%Y-%m-%d %H:%M:%S')}", styles['Normal']))
    if diagnosis.is_demo_result:
         elements.append(Paragraph("Note: This is a Demo / Mock Result", styles['Disclaimer']))
    elements.append(Spacer(1, 20))

    # Diagnosis Result
    elements.append(Paragraph("Diagnosis Results", styles['SubTitle']))
    result_data = [
        ["Plant Type", _clean_text(diagnosis.plant_type or "Unknown", is_telugu)],
        ["Detected Issue", _clean_text(diagnosis.disease_name or "Unknown", is_telugu)],
        ["AI Confidence", f"{(diagnosis.confidence * 100):.1f}%" if diagnosis.confidence else "N/A"]
    ]
    t = Table(result_data, colWidths=[200, 300])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor("#1e293b")),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, -1), base_font),
        ('FONTNAME', (0, 0), (0, -1), base_font_bold),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 1, colors.HexColor("#cbd5e1"))
    ]))
    elements.append(t)
    elements.append(Spacer(1, 20))

    # Symptoms
    elements.append(Paragraph("Detected Symptoms", styles['SubTitle']))
    try:
        symptoms = json.loads(diagnosis.symptoms_json)
        for sym in symptoms:
            elements.append(Paragraph(f"• {_clean_text(sym, is_telugu)}", styles['Normal']))
    except:
        elements.append(Paragraph("None recorded.", styles['Normal']))
    elements.append(Spacer(1, 15))

    # Advice
    elements.append(Paragraph("Remedies & Prevention Advice", styles['SubTitle']))
    try:
        advice = json.loads(diagnosis.advice_json) if getattr(diagnosis, 'advice_json', None) else json.loads(diagnosis.natural_remedies_json)
        for adv in advice:
            elements.append(Paragraph(f"• {_clean_text(adv, is_telugu)}", styles['Normal']))
    except:
        elements.append(Paragraph("No advice recorded.", styles['Normal']))
    elements.append(Spacer(1, 30))

    # Disclaimer
    elements.append(Paragraph(
        "Note: Soil parameters (NPK, pH, humidity, rainfall) are available only in crop prediction reports. "
        "Leaf image diagnosis cannot scientifically determine exact soil metrics.",
        styles['Disclaimer']
    ))
    elements.append(Paragraph(
        "DISCLAIMER: This report is AI-assisted visual guidance and must be verified with agricultural experts before applying treatments.", 
        styles['Disclaimer']
    ))

    doc.build(elements)
    buffer.seek(0)
    return buffer
