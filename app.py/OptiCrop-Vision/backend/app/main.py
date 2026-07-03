from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import os

from .database import engine, Base, SessionLocal
from .models import ErrorLog

# Ensure all tables are created (creates new tables, doesn't drop existing ones)
Base.metadata.create_all(bind=engine)

from fastapi.responses import JSONResponse
import traceback

from .auth import router as auth_router
from .predict import router as predict_router
from .crops import router as crops_router
from .reports import router as reports_router
from .admin import router as admin_router
from .vision import router as vision_router
from .dashboard import router as dashboard_router
from .weather import router as weather_router
from .assistant import router as assistant_router
from .tts import router as tts_router

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="OptiCrop API Core",
    description="High-performance crop recommendation, agronomy reporting, and agricultural catalog engine.",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = str(exc)
    route = request.url.path
    
    # Safe error logging, no bodies or tokens saved
    try:
        db = SessionLocal()
        error_log = ErrorLog(
            route=route,
            error_message=error_msg[:500]  # truncate to prevent massive logs
        )
        db.add(error_log)
        db.commit()
        db.close()
    except Exception as e:
        print(f"Failed to log error: {e}")

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error. The issue has been logged securely."}
    )

# Enable CORS for flexible local and container networking
cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost")
origins = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include core subrouters
app.include_router(auth_router)
app.include_router(predict_router)
app.include_router(crops_router)
app.include_router(reports_router)
app.include_router(admin_router)
app.include_router(vision_router)
app.include_router(dashboard_router)
app.include_router(weather_router)
app.include_router(assistant_router)
app.include_router(tts_router)

@app.get("/health")
def health_check():
    return {"status": "OK", "service": "OptiCrop API Core"}

@app.get("/")
def read_root():
    return {
        "service": "OptiCrop Core API Engine",
        "status": "HEALTHY",
        "database": "CONNECTED",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
