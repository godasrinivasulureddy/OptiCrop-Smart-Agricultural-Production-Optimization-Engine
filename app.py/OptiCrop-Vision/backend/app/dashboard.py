from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from .database import get_db
from .models import User, Prediction, ImageDiagnosis
from .schemas import DashboardSummaryResponse
from .auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard Analytics"])

@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_id = current_user.id
    
    # 1. Total Counts
    total_preds = db.query(Prediction).filter(Prediction.user_id == user_id).count()
    total_scans = db.query(ImageDiagnosis).filter(ImageDiagnosis.user_id == user_id).count()
    
    # 2. Crop Distribution
    crop_counts = db.query(Prediction.predicted_crop, func.count(Prediction.id).label('count')) \
        .filter(Prediction.user_id == user_id) \
        .group_by(Prediction.predicted_crop) \
        .order_by(func.count(Prediction.id).desc()).all()
        
    pred_count_by_crop = [{"name": row[0], "value": row[1]} for row in crop_counts]
    most_rec_crop = pred_count_by_crop[0]["name"] if pred_count_by_crop else None
    
    # 3. Disease Distribution
    disease_counts = db.query(ImageDiagnosis.disease_name, func.count(ImageDiagnosis.id).label('count')) \
        .filter(ImageDiagnosis.user_id == user_id) \
        .group_by(ImageDiagnosis.disease_name) \
        .order_by(func.count(ImageDiagnosis.id).desc()).all()
        
    dis_count_by_name = [{"name": row[0], "value": row[1]} for row in disease_counts]
    most_det_disease = dis_count_by_name[0]["name"] if dis_count_by_name else None
    
    # 4. Recent Activity
    activity = []
    
    # Fetch recent predictions
    recent_preds = db.query(Prediction).filter(Prediction.user_id == user_id).order_by(Prediction.timestamp.desc()).limit(10).all()
    for p in recent_preds:
        activity.append({
            "id": p.id,
            "type": "prediction",
            "title": f"Crop Prediction: {p.predicted_crop}",
            "subtitle": "Tabular AI Inference",
            "timestamp": p.timestamp,
            "metadata": {"confidence": p.confidence, "crop": p.predicted_crop}
        })
        
    # Fetch recent vision scans
    recent_scans = db.query(ImageDiagnosis).filter(ImageDiagnosis.user_id == user_id).order_by(ImageDiagnosis.created_at.desc()).limit(10).all()
    for s in recent_scans:
        activity.append({
            "id": s.id,
            "type": "vision",
            "title": f"Leaf Scan: {s.disease_name}",
            "subtitle": s.plant_type or "Unknown Plant",
            "timestamp": s.created_at,
            "metadata": {"confidence": s.confidence, "disease": s.disease_name}
        })
        
    # Sort combined activity by timestamp descending and take top 10
    activity.sort(key=lambda x: x["timestamp"], reverse=True)
    activity = activity[:10]
    
    return {
        "total_predictions": total_preds,
        "total_leaf_scans": total_scans,
        "most_recommended_crop": most_rec_crop,
        "most_detected_disease": most_det_disease,
        "prediction_count_by_crop": pred_count_by_crop,
        "disease_count_by_name": dis_count_by_name,
        "recent_activity": activity
    }
