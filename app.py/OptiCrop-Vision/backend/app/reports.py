from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .database import get_db
from .models import Report, Prediction, User
from .schemas import ReportResponse, ReportDetailResponse
from .auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports Core"])

@router.get("", response_model=List[ReportDetailResponse])
def get_user_reports(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Report).filter(Report.user_id == current_user.id).order_by(Report.created_at.desc()).all()

@router.delete("/{report_id}")
def delete_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found.")
    
    if report.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied.")
    
    db.delete(report)
    db.commit()
    return {"message": "Report deleted successfully. Linked prediction and soil data remain untouched."}

@router.get("/{report_id}", response_model=ReportResponse)
def get_single_report(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Requested agronomy report was not found.")
    
    # Check access control
    if report.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied. You do not own this report.")
        
    return report

@router.get("/prediction/{prediction_id}", response_model=ReportResponse)
def get_report_by_prediction(prediction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.prediction_id == prediction_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="No report generated for this prediction.")
        
    if report.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    return report

from fastapi.responses import StreamingResponse
from .pdf_service import generate_crop_report_pdf
from .models import SoilData

@router.get("/{report_id}/pdf")
def download_report_pdf(report_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Requested agronomy report was not found.")
    
    if report.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    prediction = db.query(Prediction).filter(Prediction.id == report.prediction_id).first()
    soil_data = db.query(SoilData).filter(SoilData.id == prediction.soil_data_id).first()
    
    if not prediction or not soil_data:
        raise HTTPException(status_code=404, detail="Incomplete report data for PDF generation.")
        
    pdf_buffer = generate_crop_report_pdf(report, prediction, soil_data, current_user)
    
    filename = f"OptiCrop_Report_{report.id}.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf", 
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

