import os
import requests
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from .database import get_db
from .models import WeatherLog, User
from .schemas import WeatherRequest, WeatherResponse
from .auth import get_current_user

from dotenv import load_dotenv
load_dotenv()

router = APIRouter(prefix="/api/weather", tags=["Weather Intelligence"])

@router.post("/fetch", response_model=WeatherResponse)
def fetch_weather(
    request: WeatherRequest, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    api_key = os.getenv("OPENWEATHER_API_KEY")
    location = request.location.strip()
    
    if not location:
        raise HTTPException(400, "Location is required")
        
    print(f"OpenWeather API key loaded: {bool(api_key and api_key.strip())}")
        
    is_demo = False
    temp = 25.0
    humidity = 60.0
    rain_1h = 0.0
    condition = "Clear"
    source = "Mock Data"
    
    if api_key and api_key.strip():
        try:
            url = f"https://api.openweathermap.org/data/2.5/weather?q={location}&appid={api_key.strip()}&units=metric"
            resp = requests.get(url, timeout=5)
            if resp.status_code == 200:
                data = resp.json()
                temp = data.get("main", {}).get("temp", 25.0)
                humidity = data.get("main", {}).get("humidity", 60.0)
                
                # Check for rain data (OpenWeather provides rain volume for last 1h)
                rain_data = data.get("rain", {})
                rain_1h = rain_data.get("1h", 0.0)
                
                weather_arr = data.get("weather", [])
                if weather_arr:
                    condition = weather_arr[0].get("main", "Clear")
                
                source = "OpenWeather Live"
            elif resp.status_code == 401:
                raise HTTPException(status_code=400, detail="OpenWeather API key is not active yet. Try again later.")
            elif resp.status_code == 404:
                raise HTTPException(status_code=404, detail="City not found by OpenWeather.")
            else:
                raise HTTPException(status_code=400, detail=f"OpenWeather API error: {resp.text}")
        except requests.exceptions.RequestException as e:
            raise HTTPException(status_code=400, detail=f"Failed to connect to OpenWeather: {str(e)}")
    else:
        is_demo = True
        
    if is_demo:
        # Generate some pseudo-random realistic mock data based on location length
        base = len(location)
        temp = 20.0 + (base % 15)
        humidity = 50.0 + (base % 40)
        rain_1h = float(base % 5)
        condition = "Cloudy (Demo)"
        source = "Mock Fallback"
        
    # Extrapolate 1h rain to an estimated monthly/seasonal agricultural rainfall
    # This is a very rough heuristic so ML doesn't fail on 0mm rainfall.
    # If 1h rain is 0, we assume a baseline seasonal average based on humidity.
    if rain_1h > 0:
        # Rough estimate: (1h rain * 5 rain events/month * 4 months)
        estimated_rainfall_mm = rain_1h * 20.0
    else:
        # Baseline estimation from humidity
        estimated_rainfall_mm = humidity * 1.5
        
    # Round to 2 decimals
    estimated_rainfall_mm = round(estimated_rainfall_mm, 2)
    
    warning = "Rainfall is estimated from live weather data and may differ from seasonal agricultural rainfall."
        
    weather_log = WeatherLog(
        user_id=current_user.id,
        location=location,
        temperature=temp,
        humidity=humidity,
        rainfall=estimated_rainfall_mm,
        weather_condition=condition
    )
    db.add(weather_log)
    db.commit()
    db.refresh(weather_log)
    
    return WeatherResponse(
        location=location,
        temperature=temp,
        humidity=humidity,
        rainfall=rain_1h,
        estimated_rainfall_mm=estimated_rainfall_mm,
        weather_condition=condition,
        source=source,
        is_demo_result=is_demo,
        warning=warning
    )
