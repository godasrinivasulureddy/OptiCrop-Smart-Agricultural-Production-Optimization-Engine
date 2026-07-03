from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from .database import get_db
from .models import User, Prediction, Crop, ImageDiagnosis, Report, WeatherLog, ErrorLog
from .schemas import AdminAnalyticsResponse
from .auth import get_current_admin
import datetime

router = APIRouter(prefix="/api/admin", tags=["Admin Control Console"])

@router.get("/analytics", response_model=AdminAnalyticsResponse)
def get_admin_analytics(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    total_users = db.query(User).count()
    total_predictions = db.query(Prediction).count()
    total_leaf_scans = db.query(ImageDiagnosis).count()
    total_reports_generated = db.query(Report).count()
    total_weather_fetches = db.query(WeatherLog).count()

    # Top crops
    crop_counts = (
        db.query(Prediction.predicted_crop, func.count(Prediction.predicted_crop))
        .group_by(Prediction.predicted_crop)
        .order_by(func.count(Prediction.predicted_crop).desc())
        .limit(5)
        .all()
    )
    top_global_crops = [{"name": name, "value": count} for name, count in crop_counts]

    # Top diseases
    disease_counts = (
        db.query(ImageDiagnosis.disease_name, func.count(ImageDiagnosis.disease_name))
        .filter(ImageDiagnosis.disease_name != None, ImageDiagnosis.disease_name != "Healthy")
        .group_by(ImageDiagnosis.disease_name)
        .order_by(func.count(ImageDiagnosis.disease_name).desc())
        .limit(5)
        .all()
    )
    top_global_diseases = [{"name": name, "value": count} for name, count in disease_counts]

    # Active users in last 7 days
    seven_days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=7)
    
    # We define active user as someone who made a prediction, a report, a scan or fetched weather
    active_pred = db.query(Prediction.user_id).filter(Prediction.created_at >= seven_days_ago)
    active_scan = db.query(ImageDiagnosis.user_id).filter(ImageDiagnosis.created_at >= seven_days_ago)
    active_weather = db.query(WeatherLog.user_id).filter(WeatherLog.fetched_at >= seven_days_ago)
    
    active_users = set([u[0] for u in active_pred] + [u[0] for u in active_scan] + [u[0] for u in active_weather])
    active_users_last_7_days = len(active_users)

    # Model usage count
    model_usage_count = db.query(Prediction).filter(Prediction.ml_model_id != None).count()

    # System Health and Errors
    recent_errors = db.query(ErrorLog).order_by(ErrorLog.created_at.desc()).limit(5).all()
    
    # Health status based on errors in last 24h
    twenty_four_hours_ago = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
    recent_error_count = db.query(ErrorLog).filter(ErrorLog.created_at >= twenty_four_hours_ago).count()
    system_health_status = "Healthy" if recent_error_count == 0 else "Degraded"

    return {
        "total_users": total_users,
        "total_predictions": total_predictions,
        "total_leaf_scans": total_leaf_scans,
        "total_reports_generated": total_reports_generated,
        "total_weather_fetches": total_weather_fetches,
        "top_global_crops": top_global_crops,
        "top_global_diseases": top_global_diseases,
        "active_users_last_7_days": active_users_last_7_days,
        "model_usage_count": model_usage_count,
        "system_health_status": system_health_status,
        "recent_errors": recent_errors
    }

@router.get("/users", response_model=List[dict])
def get_all_users_admin(db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    users = db.query(User).all()
    return [{
        "id": u.id,
        "email": u.email,
        "full_name": u.full_name,
        "is_admin": u.is_admin,
        "created_at": u.created_at
    } for u in users]

import json
import os

@router.get("/models")
def get_model_metrics(current_admin: User = Depends(get_current_admin)):
    metrics_path = os.path.join(os.path.dirname(__file__), "model_metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model metrics not found.")
    
    try:
        with open(metrics_path, "r") as f:
            data = json.load(f)
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
