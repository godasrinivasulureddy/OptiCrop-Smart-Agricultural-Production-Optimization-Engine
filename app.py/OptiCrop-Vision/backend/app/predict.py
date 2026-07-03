import os
import joblib
import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import numpy as np

try:
    import shap
except ImportError:
    shap = None

from .database import get_db
from .models import Prediction, User, Crop, Report, SoilData
from .schemas import PredictionRequest, PredictionResponse, ReportResponse, SuitabilityRequest, SuitabilityResponse
from .auth import get_current_user

router = APIRouter(prefix="/api/predict", tags=["Prediction Engine"])

# Load model if it exists
MODEL_PATH = os.path.join(os.path.dirname(__file__), "crop_model.joblib")
model = None

if os.path.exists(MODEL_PATH):
    try:
        model = joblib.load(MODEL_PATH)
        print(f"Crop model successfully loaded from {MODEL_PATH}")
    except Exception as e:
        print(f"Warning: Failed to load crop model from {MODEL_PATH}: {e}")

# Static fallback crops
FALLBACK_CROPS = [
    {"name": "rice", "N": 80, "P": 40, "K": 40, "temp": 24, "humidity": 82, "ph": 6.5, "rainfall": 230, "season": "Kharif"},
    {"name": "maize", "N": 100, "P": 45, "K": 30, "temp": 22, "humidity": 65, "ph": 6.2, "rainfall": 80, "season": "Kharif"},
    {"name": "wheat", "N": 90, "P": 45, "K": 40, "temp": 20, "humidity": 55, "ph": 6.5, "rainfall": 100, "season": "Rabi"},
]

def generate_optimization_suggestions(crop_name: str, N: float, P: float, K: float, ph: float, rain: float) -> list:
    suggestions = []
    
    # Generic suggestions based on standard profiles (since we might not have exact DB values for all 22 crops)
    # Water
    if rain < 50:
        suggestions.append("Water Requirement: High. The predicted rainfall is very low. Heavy irrigation is required.")
    elif rain < 100:
        suggestions.append("Water Requirement: Medium. Supplemental irrigation is advised.")
    else:
        suggestions.append("Water Requirement: Low to None. Natural rainfall should be sufficient.")
        
    # pH
    if ph < 5.5:
        suggestions.append("pH Correction: Soil is highly acidic. Consider applying agricultural lime.")
    elif ph > 7.5:
        suggestions.append("pH Correction: Soil is alkaline. Consider adding sulfur or organic compost.")
    else:
        suggestions.append("pH Correction: Soil pH is in a generally optimal range for most crops.")
        
    # Fertilizer general advice
    if N < 40:
        suggestions.append("Fertilizer: Nitrogen levels are low. Apply urea or N-rich compost.")
    if P < 30:
        suggestions.append("Fertilizer: Phosphorus levels are on the lower side. Consider DAP or superphosphate.")
    if K < 30:
        suggestions.append("Fertilizer: Potassium levels are low. Muriate of Potash (MOP) is recommended.")
        
    return suggestions

def run_prediction_engine(N: float, P: float, K: float, temp: float, hum: float, ph: float, rain: float, season: str, db: Session) -> tuple:
    global model
    if model is None:
        if os.path.exists(MODEL_PATH):
            try:
                model = joblib.load(MODEL_PATH)
            except Exception:
                pass

    top_3_crops = []
    
    if model is not None:
        try:
            # Construct DataFrame with exactly 8 features for the Pipeline
            input_data = pd.DataFrame([{
                "N": N, "P": P, "K": K, 
                "temperature": temp, "humidity": hum, 
                "ph": ph, "rainfall": rain, 
                "season": season
            }])
            crop_index = model.predict(input_data)[0]
            
            # Get probabilities if available
            if hasattr(model, "predict_proba"):
                probs = model.predict_proba(input_data)[0]
                confidence = float(max(probs))
                
                # Get Top 3
                if hasattr(model.named_steps['classifier'], "classes_"):
                    classes = model.named_steps['classifier'].classes_
                    top_indices = np.argsort(probs)[-3:][::-1]
                    for idx in top_indices:
                        if probs[idx] > 0.01: # only include if prob > 1%
                            top_3_crops.append({"crop": str(classes[idx]).capitalize(), "probability": float(probs[idx])})
            else:
                confidence = 0.89 
                
            explanation = {"explanation_source": "fallback", "top_features": [], "summary": "No explanation available."}
            
            # Attempt SHAP explanation
            if shap is not None and hasattr(model, 'named_steps') and 'preprocessor' in model.named_steps and 'classifier' in model.named_steps:
                try:
                    preprocessor = model.named_steps['preprocessor']
                    classifier = model.named_steps['classifier']
                    
                    transformed = preprocessor.transform(input_data)
                    
                    if hasattr(preprocessor, "get_feature_names_out"):
                        feature_names = preprocessor.get_feature_names_out()
                    else:
                        feature_names = [f"Feature {i}" for i in range(transformed.shape[1])]
                        
                    explainer = shap.TreeExplainer(classifier)
                    shap_values = explainer.shap_values(transformed)
                    
                    if isinstance(shap_values, list):
                        class_idx = list(classifier.classes_).index(crop_index) if hasattr(classifier, "classes_") else 0
                        feature_impacts = np.abs(shap_values[class_idx][0])
                    else:
                        if len(shap_values.shape) == 3:
                            class_idx = list(classifier.classes_).index(crop_index) if hasattr(classifier, "classes_") else 0
                            feature_impacts = np.abs(shap_values[0, :, class_idx])
                        else:
                            feature_impacts = np.abs(shap_values[0])
                            
                    total_impact = np.sum(feature_impacts)
                    
                    if total_impact > 0:
                        impact_percentages = feature_impacts / total_impact
                        impact_records = []
                        for i in range(len(feature_names)):
                            name = str(feature_names[i]).replace('num__', '').replace('cat__season_', 'Season: ').capitalize()
                            impact_records.append({"feature": name, "impact": float(impact_percentages[i])})
                            
                        # Sort descending
                        impact_records = sorted(impact_records, key=lambda x: x["impact"], reverse=True)
                        top_3 = impact_records[:3]
                        
                        summary = f"{top_3[0]['feature']} and {top_3[1]['feature']} strongly influenced this recommendation."
                        explanation = {
                            "explanation_source": "shap",
                            "top_features": top_3,
                            "summary": summary
                        }
                except Exception as e:
                    print(f"SHAP explanation failed: {e}")

            if not top_3_crops:
                top_3_crops = [{"crop": str(crop_index).capitalize(), "probability": confidence}]

            return str(crop_index).capitalize(), confidence, explanation, top_3_crops

        except Exception as e:
            print(f"Model prediction failed, executing fallback matching: {e}")

    # Fallback heuristic matching
    db_crops = db.query(Crop).all()
    crops_to_evaluate = []
    
    if len(db_crops) > 0:
        for c in db_crops:
            crops_to_evaluate.append({
                "name": c.name,
                "N": (c.min_N + c.max_N) / 2,
                "P": (c.min_P + c.max_P) / 2,
                "K": (c.min_K + c.max_K) / 2,
                "temp": (c.min_temp + c.max_temp) / 2,
                "humidity": (c.min_humidity + c.max_humidity) / 2,
                "ph": (c.min_ph + c.max_ph) / 2,
                "rainfall": (c.min_rainfall + c.max_rainfall) / 2,
                "season": c.optimal_season
            })
    else:
        crops_to_evaluate = FALLBACK_CROPS

    best_crop = "Wheat"
    min_dist = float("inf")
    scales = {"N": 100.0, "P": 100.0, "K": 150.0, "temp": 30.0, "humidity": 100.0, "ph": 7.0, "rainfall": 200.0}

    for crop in crops_to_evaluate:
        dist = (
            ((N - crop["N"]) / scales["N"]) ** 2 +
            ((P - crop["P"]) / scales["P"]) ** 2 +
            ((K - crop["K"]) / scales["K"]) ** 2 +
            ((temp - crop["temp"]) / scales["temp"]) ** 2 +
            ((hum - crop["humidity"]) / scales["humidity"]) ** 2 +
            ((ph - crop["ph"]) / scales["ph"]) ** 2 +
            ((rain - crop["rainfall"]) / scales["rainfall"]) ** 2
        )
        
        if season.lower() != crop["season"].lower() and crop["season"].lower() != "whole year":
            dist += 1.5

        if dist < min_dist:
            min_dist = dist
            best_crop = crop["name"]
            
    # Fallback explanation
    try:
        best_crop_data = next(c for c in crops_to_evaluate if c["name"] == best_crop)
        distances = {
            "Nitrogen": ((N - best_crop_data["N"]) / scales["N"]) ** 2,
            "Phosphorus": ((P - best_crop_data["P"]) / scales["P"]) ** 2,
            "Potassium": ((K - best_crop_data["K"]) / scales["K"]) ** 2,
            "Temperature": ((temp - best_crop_data["temp"]) / scales["temp"]) ** 2,
            "Humidity": ((hum - best_crop_data["humidity"]) / scales["humidity"]) ** 2,
            "Ph": ((ph - best_crop_data["ph"]) / scales["ph"]) ** 2,
            "Rainfall": ((rain - best_crop_data["rainfall"]) / scales["rainfall"]) ** 2
        }
        max_dist = max(distances.values())
        if max_dist == 0: max_dist = 1
        inverted = {k: (max_dist - v) for k, v in distances.items()}
        total_inv = sum(inverted.values())
        if total_inv == 0: total_inv = 1
        
        impacts = [{"feature": k, "impact": float(v / total_inv)} for k, v in inverted.items()]
        impacts = sorted(impacts, key=lambda x: x["impact"], reverse=True)[:3]
        summary = f"{impacts[0]['feature']} and {impacts[1]['feature']} closely matched the ideal profile for {best_crop.capitalize()}."
        
        explanation = {
            "explanation_source": "fallback",
            "top_features": impacts,
            "summary": summary
        }
    except Exception as e:
        print(f"Fallback explanation failed: {e}")
        explanation = {"explanation_source": "fallback", "top_features": [], "summary": "No explanation available."}

    confidence = max(0.40, min(0.98, 1.0 - (min_dist / 4.0)))
    top_3_crops = [{"crop": best_crop.capitalize(), "probability": confidence}]
    
    return best_crop.capitalize(), float(confidence), explanation, top_3_crops

@router.post("", response_model=PredictionResponse)
def create_prediction(req: PredictionRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    predicted_crop, confidence, explanation, top_3 = run_prediction_engine(
        req.N, req.P, req.K, req.temperature, req.humidity, req.ph, req.rainfall, req.season, db
    )

    optimization_suggestions = generate_optimization_suggestions(predicted_crop, req.N, req.P, req.K, req.ph, req.rainfall)

    # Save SoilData
    soil_data = SoilData(
        N=req.N,
        P=req.P,
        K=req.K,
        temperature=req.temperature,
        humidity=req.humidity,
        ph=req.ph,
        rainfall=req.rainfall,
        season=req.season
    )
    db.add(soil_data)
    db.commit()
    db.refresh(soil_data)

    # Save to SQLite database Prediction linking to SoilData
    new_prediction = Prediction(
        user_id=current_user.id,
        soil_data_id=soil_data.id,
        predicted_crop=predicted_crop,
        confidence=confidence
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)

    # Automatically generate corresponding Report
    report_title = f"Soil Cultivation Plan for {predicted_crop}"
    report_summary = (
        f"Based on soil composition (N:{req.N}, P:{req.P}, K:{req.K}) and environmental indicators "
        f"(Temperature:{req.temperature}°C, Humidity:{req.humidity}%, Soil pH:{req.ph}, Rainfall:{req.rainfall}mm), "
        f"we highly recommend sowing {predicted_crop} for the {req.season} season."
    )
    
    opt_text = "\n".join([f"- {s}" for s in optimization_suggestions])
    
    action_plan = (
        f"1. Soil Prep: Ensure adequate drainage. {predicted_crop} grows best in soil with pH close to {req.ph}.\n"
        f"2. Optimization Suggestions:\n{opt_text}\n"
        f"3. Monitoring: Maintain checkups for symptoms of common {predicted_crop} diseases during the active growth cycle.\n"
        f"4. AI Explanation: {explanation['summary']} ({'Powered by SHAP' if explanation['explanation_source'] == 'shap' else 'Fallback Heuristic'})"
    )

    new_report = Report(
        prediction_id=new_prediction.id,
        user_id=current_user.id,
        title=report_title,
        summary=report_summary,
        action_plan=action_plan
    )
    db.add(new_report)
    db.commit()

    response_data = {
        "id": new_prediction.id,
        "predicted_crop": new_prediction.predicted_crop,
        "confidence": new_prediction.confidence,
        "timestamp": new_prediction.timestamp,
        "soil_data": soil_data,
        "explanation": explanation,
        "top_3_crops": top_3,
        "optimization_suggestions": optimization_suggestions
    }

    return response_data

@router.post("/suitability", response_model=SuitabilityResponse)
def check_suitability(req: SuitabilityRequest, db: Session = Depends(get_db)):
    # Simple bounds checking based on standard crop ranges or a predefined heuristic.
    target = req.target_crop.lower().strip()
    
    # We can pull from the Crop table if it exists, otherwise use a generic check
    crop_info = db.query(Crop).filter(Crop.name.ilike(target)).first()
    
    limiting_factors = []
    
    if crop_info:
        if not (crop_info.min_N <= req.N <= crop_info.max_N):
            limiting_factors.append(f"Nitrogen is outside optimal range ({crop_info.min_N}-{crop_info.max_N}).")
        if not (crop_info.min_P <= req.P <= crop_info.max_P):
            limiting_factors.append(f"Phosphorus is outside optimal range ({crop_info.min_P}-{crop_info.max_P}).")
        if not (crop_info.min_K <= req.K <= crop_info.max_K):
            limiting_factors.append(f"Potassium is outside optimal range ({crop_info.min_K}-{crop_info.max_K}).")
        if not (crop_info.min_temp <= req.temperature <= crop_info.max_temp):
            limiting_factors.append(f"Temperature is outside optimal range ({crop_info.min_temp}-{crop_info.max_temp}°C).")
        if not (crop_info.min_ph <= req.ph <= crop_info.max_ph):
            limiting_factors.append(f"pH is outside optimal range ({crop_info.min_ph}-{crop_info.max_ph}).")
        if not (crop_info.min_rainfall <= req.rainfall <= crop_info.max_rainfall):
            limiting_factors.append(f"Rainfall is outside optimal range ({crop_info.min_rainfall}-{crop_info.max_rainfall}mm).")
    else:
        # Generic check if not in DB
        if req.ph < 5.0 or req.ph > 8.5:
            limiting_factors.append("pH is extreme for most crops.")
        if req.rainfall < 50:
            limiting_factors.append("Rainfall is very low for most crops.")
        if req.temperature > 40:
            limiting_factors.append("Temperature is too high for most crops.")

    if len(limiting_factors) == 0:
        status_text = "Suitable"
        reason = f"The environmental and soil conditions are optimal for {req.target_crop.capitalize()}."
    elif len(limiting_factors) <= 2:
        status_text = "Partially Suitable"
        reason = f"The conditions are mostly acceptable for {req.target_crop.capitalize()}, but some adjustments are needed."
    else:
        status_text = "Not Suitable"
        reason = f"The conditions are significantly outside the recommended ranges for {req.target_crop.capitalize()}."

    return {
        "status": status_text,
        "reason": reason,
        "limiting_factors": limiting_factors
    }

@router.get("/history", response_model=List[PredictionResponse])
def get_prediction_history(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    history = db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.timestamp.desc()).all()
    return history

@router.delete("/{prediction_id}")
def delete_prediction(prediction_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    prediction = db.query(Prediction).filter(Prediction.id == prediction_id).first()
    if not prediction:
        raise HTTPException(status_code=404, detail="Prediction not found.")
        
    if prediction.user_id != current_user.id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    db.delete(prediction)
    db.commit()
    return {"message": "Prediction deleted successfully."}
