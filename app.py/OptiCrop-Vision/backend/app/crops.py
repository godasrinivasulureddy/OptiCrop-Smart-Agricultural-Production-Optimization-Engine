from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from .database import get_db
from .models import Crop
from .schemas import CropCreate, CropResponse
from .auth import get_current_user, get_current_admin

router = APIRouter(prefix="/api/crops", tags=["Crop Catalog"])

@router.get("", response_model=List[CropResponse])
def list_crops(db: Session = Depends(get_db)):
    return db.query(Crop).all()

@router.post("", response_model=CropResponse, status_code=status.HTTP_201_CREATED)
def create_crop(crop_in: CropCreate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    existing = db.query(Crop).filter(Crop.name == crop_in.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="A crop with this name already exists in catalog.")
    
    new_crop = Crop(**crop_in.dict())
    db.add(new_crop)
    db.commit()
    db.refresh(new_crop)
    return new_crop

@router.put("/{crop_id}", response_model=CropResponse)
def update_crop(crop_id: int, crop_in: CropCreate, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found in catalog.")
    
    for key, val in crop_in.dict().items():
        setattr(crop, key, val)
        
    db.commit()
    db.refresh(crop)
    return crop

@router.delete("/{crop_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crop(crop_id: int, db: Session = Depends(get_db), current_admin = Depends(get_current_admin)):
    crop = db.query(Crop).filter(Crop.id == crop_id).first()
    if not crop:
        raise HTTPException(status_code=404, detail="Crop not found in catalog.")
    
    db.delete(crop)
    db.commit()
    return None
