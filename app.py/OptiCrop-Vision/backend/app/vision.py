import os
import uuid
import json
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
from dotenv import load_dotenv

from .database import get_db
from .models import ImageDiagnosis, User
from .schemas import ImageDiagnosisResponse
from .auth import get_current_user

load_dotenv()

router = APIRouter(prefix="/api/vision", tags=["Image Diagnosis"])

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

try:
    from google import genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

from PIL import Image

def get_mock_diagnosis():
    return {
        "plant_type": "Generic Leaf (Demo)",
        "disease_name": "Possible Nitrogen Deficiency / Chlorosis",
        "confidence": 0.85,
        "health_status": "Nutrient Deficiency",
        "farmer_summary": "This is a demo result. The leaf shows signs of nitrogen deficiency.",
        "symptoms_json": json.dumps([
            "Yellowing of older leaves",
            "Stunted growth visible",
            "Pale green overall appearance"
        ]),
        "natural_remedies_json": json.dumps([
            "Perform a proper soil test to confirm N deficiency.",
            "Apply compost or organic manure."
        ]),
        "organic_fertilizer_suggestions_json": json.dumps(["Jeevamrutham", "Vermicompost"]),
        "preventive_care_json": json.dumps(["Crop rotation", "Cover cropping with legumes"]),
        "is_demo_result": True
    }

from .services.ai_providers import provider_router

@router.post("/analyze", response_model=ImageDiagnosisResponse)
async def analyze_image(
    file: UploadFile = File(...), 
    language: str = Form("english"),
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    if file.content_type not in ["image/jpeg", "image/png", "image/webp"]:
        raise HTTPException(400, "Invalid file type. Only JPEG, PNG, WEBP allowed.")
        
    ext = file.filename.split('.')[-1]
    unique_filename = f"{uuid.uuid4().hex}.{ext}"
    file_path = os.path.join(UPLOAD_DIR, unique_filename)
    
    with open(file_path, "wb") as f:
        f.write(await file.read())

    lang_instruction = "Respond entirely in Telugu." if language.lower() == 'telugu' else "Respond entirely in English."
    prompt = f"""
    Analyze this leaf/crop image for any visible diseases, pests, or nutrient deficiencies.
    DO NOT guess soil N, P, K, pH, rainfall, or humidity values - it is scientifically invalid to do so from a simple image.
    {lang_instruction}
    
    Prefer natural farming suggestions such as neem oil, compost, jeevamrutham, organic manure, proper watering, pruning infected leaves. Mention expert consultation for severe cases.
    
    Provide response STRICTLY in JSON format with exactly these keys:
    - plant_type: (string)
    - health_status: (string: "Healthy", "Disease Suspected", "Pest Damage", "Nutrient Deficiency", or "Unknown")
    - disease_name: (string)
    - confidence: (float between 0 and 1)
    - visible_symptoms: (list of strings)
    - farmer_summary: (string, brief summary)
    - natural_remedies: (list of strings)
    - organic_fertilizer_suggestions: (list of strings)
    - preventive_care: (list of strings)
    """

    diagnosis_data, source_badge, model_used = provider_router.run_vision_chain(file_path, prompt, language)
    
    if not diagnosis_data:
        error_msg = source_badge if source_badge else "All Gemini API keys exhausted or unavailable. Try later."
        raise HTTPException(
            status_code=503, 
            detail=error_msg
        )
    else:
        # Prepend fallback model source to farmer_summary to avoid schema changes
        if source_badge != "gemini":
            if diagnosis_data.get("farmer_summary"):
                diagnosis_data["farmer_summary"] = f"[Fallback: {source_badge}] {diagnosis_data['farmer_summary']}"
            else:
                diagnosis_data["farmer_summary"] = f"[Fallback: {source_badge}]"

    # Map AI JSON output to database columns with safe defaults
    mapped_data = {
        "plant_type": diagnosis_data.get("plant_type") or "Unknown Plant",
        "disease_name": diagnosis_data.get("disease_name") or "Unknown Condition",
        "confidence": diagnosis_data.get("confidence") or 0.0,
        "language": diagnosis_data.get("language") or language,
        "health_status": diagnosis_data.get("health_status") or "Unknown",
        "farmer_summary": diagnosis_data.get("farmer_summary") or "Analysis completed but no summary was provided by AI.",
        "is_demo_result": diagnosis_data.get("is_demo_result", False)
    }
    
    # Handle JSON arrays which may have come under various keys
    import json
    
    def safe_array(val):
        if not val:
            return ["No specific items returned."]
        if isinstance(val, list) and len(val) > 0:
            return val
        return [str(val)]
    
    # Symptoms
    symptoms = safe_array(diagnosis_data.get("visible_symptoms") or diagnosis_data.get("symptoms"))
    mapped_data["symptoms_json"] = json.dumps(symptoms)
    
    # Advice / Remedies
    advice = safe_array(diagnosis_data.get("natural_remedies") or diagnosis_data.get("advice"))
    mapped_data["natural_remedies_json"] = json.dumps(advice)
    mapped_data["advice_json"] = mapped_data["natural_remedies_json"]
    
    # Fertilizers
    fertilizers = safe_array(diagnosis_data.get("organic_fertilizer_suggestions"))
    mapped_data["organic_fertilizer_suggestions_json"] = json.dumps(fertilizers)
    
    # Preventive Care
    preventive = safe_array(diagnosis_data.get("preventive_care"))
    mapped_data["preventive_care_json"] = json.dumps(preventive)

    diagnosis = ImageDiagnosis(
        user_id=current_user.id,
        image_filename=unique_filename,
        **mapped_data
    )
    
    db.add(diagnosis)
    db.commit()
    db.refresh(diagnosis)
    
    # Construct exact response payload required by frontend
    response_dict = {
        "id": diagnosis.id,
        "plant_type": diagnosis.plant_type,
        "health_status": diagnosis.health_status,
        "disease_name": diagnosis.disease_name,
        "confidence": diagnosis.confidence,
        "farmer_summary": diagnosis.farmer_summary,
        "visible_symptoms": symptoms,
        "natural_remedies": advice,
        "organic_fertilizer_suggestions": fertilizers,
        "preventive_care": preventive,
        "language": diagnosis.language,
        "source": source_badge or "gemini",
        "model_used": model_used or "gemini-2.5-flash",
        "is_demo_result": diagnosis.is_demo_result,
        "created_at": diagnosis.created_at,
        "symptoms_json": diagnosis.symptoms_json,
        "advice_json": diagnosis.advice_json,
        "natural_remedies_json": diagnosis.natural_remedies_json,
        "organic_fertilizer_suggestions_json": diagnosis.organic_fertilizer_suggestions_json,
        "preventive_care_json": diagnosis.preventive_care_json
    }
    
    print(f"VISION RESPONSE SENT: {list(response_dict.keys())}")
    
    return response_dict

@router.get("/history", response_model=List[ImageDiagnosisResponse])
def get_vision_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(ImageDiagnosis).filter(ImageDiagnosis.user_id == current_user.id).order_by(ImageDiagnosis.created_at.desc()).all()

from fastapi.responses import StreamingResponse
from .pdf_service import generate_vision_report_pdf

@router.get("/history/{diagnosis_id}/pdf")
def download_vision_pdf(diagnosis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    diagnosis = db.query(ImageDiagnosis).filter(ImageDiagnosis.id == diagnosis_id).first()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Diagnosis not found.")
        
    if diagnosis.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    pdf_buffer = generate_vision_report_pdf(diagnosis, current_user)
    
    filename = f"OptiCrop_Leaf_Diagnosis_{diagnosis.id}.pdf"
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.delete("/{diagnosis_id}")
def delete_diagnosis(diagnosis_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    diagnosis = db.query(ImageDiagnosis).filter(ImageDiagnosis.id == diagnosis_id).first()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Diagnosis not found.")
        
    if diagnosis.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    db.delete(diagnosis)
    db.commit()
    return {"message": "Diagnosis deleted successfully."}

