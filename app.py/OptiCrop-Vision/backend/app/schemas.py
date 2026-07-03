from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: int
    is_admin: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

# Crop Schemas
class CropBase(BaseModel):
    name: str
    min_N: float
    max_N: float
    min_P: float
    max_P: float
    min_K: float
    max_K: float
    min_temp: float
    max_temp: float
    min_humidity: float
    max_humidity: float
    min_ph: float
    max_ph: float
    min_rainfall: float
    max_rainfall: float
    optimal_season: str

class CropCreate(CropBase):
    pass

class CropResponse(CropBase):
    id: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

# Soil Data Schemas
class SoilDataSchema(BaseModel):
    N: float
    P: float
    K: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float
    season: str

# Prediction Schemas
class FeatureImpact(BaseModel):
    feature: str
    impact: float

class Explanation(BaseModel):
    explanation_source: str
    top_features: List[FeatureImpact]
    summary: str

class CropProbability(BaseModel):
    crop: str
    probability: float

class SuitabilityRequest(BaseModel):
    target_crop: str
    N: float = Field(..., ge=0, le=150)
    P: float = Field(..., ge=0, le=150)
    K: float = Field(..., ge=0, le=150)
    temperature: float = Field(..., ge=-10, le=60)
    humidity: float = Field(..., ge=0, le=100)
    ph: float = Field(..., ge=3, le=10)
    rainfall: float = Field(..., ge=0, le=500)

class SuitabilityResponse(BaseModel):
    status: str
    reason: str
    limiting_factors: List[str]

class PredictionRequest(BaseModel):
    N: float = Field(..., ge=0, le=150, description="Nitrogen content in soil (mg/kg)")
    P: float = Field(..., ge=0, le=150, description="Phosphorus content in soil (mg/kg)")
    K: float = Field(..., ge=0, le=150, description="Potassium content in soil (mg/kg)")
    temperature: float = Field(..., ge=-10, le=60, description="Air temperature in Celsius")
    humidity: float = Field(..., ge=0, le=100, description="Relative humidity in percentage")
    ph: float = Field(..., ge=3, le=10, description="Soil pH value")
    rainfall: float = Field(..., ge=0, le=500, description="Estimated rainfall in mm")
    season: str = Field(..., description="Season of prediction: e.g., 'Kharif', 'Rabi', 'Zaid', 'Whole Year'")

class PredictionResponse(BaseModel):
    id: int
    predicted_crop: str
    confidence: float
    timestamp: datetime.datetime
    soil_data: SoilDataSchema
    explanation: Optional[Explanation] = None
    top_3_crops: Optional[List[CropProbability]] = None
    optimization_suggestions: Optional[List[str]] = None

    class Config:
        from_attributes = True

# Report Schemas
class ReportResponse(BaseModel):
    id: int
    prediction_id: int
    title: str
    summary: str
    action_plan: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ReportDetailResponse(ReportResponse):
    prediction: PredictionResponse

    class Config:
        from_attributes = True

class ErrorLogResponse(BaseModel):
    id: int
    route: Optional[str]
    error_message: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class ChartData(BaseModel):
    name: str
    value: int

class AdminAnalyticsResponse(BaseModel):
    total_users: int
    total_predictions: int
    total_leaf_scans: int
    total_reports_generated: int
    total_weather_fetches: int
    top_global_crops: List[ChartData]
    top_global_diseases: List[ChartData]
    active_users_last_7_days: int
    model_usage_count: int
    system_health_status: str
    recent_errors: List[ErrorLogResponse]

# Image Diagnosis Schemas
class ImageDiagnosisResponse(BaseModel):
    id: int
    plant_type: Optional[str]
    health_status: Optional[str] = None
    disease_name: Optional[str]
    confidence: Optional[float]
    farmer_summary: Optional[str] = None
    visible_symptoms: List[str] = []
    natural_remedies: List[str] = []
    organic_fertilizer_suggestions: List[str] = []
    preventive_care: List[str] = []
    language: Optional[str] = None
    source: str = "gemini"
    model_used: str = "gemini-2.5-flash"
    is_demo_result: bool
    created_at: datetime.datetime

    # Keep these for backwards compatibility with DB if needed, but not strictly required in response
    symptoms_json: Optional[str] = None
    advice_json: Optional[str] = None
    natural_remedies_json: Optional[str] = None
    organic_fertilizer_suggestions_json: Optional[str] = None
    preventive_care_json: Optional[str] = None

    class Config:
        from_attributes = True

# Chat Assistant Schemas
class ChatRequest(BaseModel):
    message: str
    language: str = "english"

class ChatResponse(BaseModel):
    response: str
    language: str
    source: str

    class Config:
        from_attributes = True

# Dashboard Schemas
class ActivityItem(BaseModel):
    id: int
    type: str  # 'prediction' or 'vision'
    title: str
    subtitle: str
    timestamp: datetime.datetime
    metadata: dict

class DashboardSummaryResponse(BaseModel):
    total_predictions: int
    total_leaf_scans: int
    most_recommended_crop: Optional[str]
    most_detected_disease: Optional[str]
    prediction_count_by_crop: List[ChartData]
    disease_count_by_name: List[ChartData]
    recent_activity: List[ActivityItem]

# Weather Schemas
class WeatherRequest(BaseModel):
    location: str

class WeatherResponse(BaseModel):
    location: str
    temperature: float
    humidity: float
    rainfall: float
    estimated_rainfall_mm: float
    weather_condition: str
    source: str
    is_demo_result: bool
    warning: str

# Password Reset Schemas
class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str
    confirm_password: str
