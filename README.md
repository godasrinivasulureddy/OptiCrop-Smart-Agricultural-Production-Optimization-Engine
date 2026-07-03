# OptiCrop – Smart Agricultural Production Optimization Engine

## Overview

OptiCrop is an intelligent agriculture-based web application developed to help farmers and agricultural users make data-driven decisions for crop cultivation.

The system analyzes soil nutrients and environmental conditions such as Nitrogen (N), Phosphorus (P), Potassium (K), Temperature, Humidity, pH, Rainfall, and Season to recommend the most suitable crop using Machine Learning models.

It also includes an AI-powered leaf disease detection system using Google Gemini Vision for identifying plant diseases and suggesting remedies.

---

## Project Objective

The main objective of OptiCrop is to improve agricultural productivity by:

- Recommending the best crop based on soil and climate conditions.
- Reducing crop failure.
- Increasing yield and farmer profits.
- Providing disease diagnosis for crop leaves.
- Offering resource optimization suggestions.

---

## Core Features

### Crop Prediction
- Predict best crop based on:
  - Nitrogen (N)
  - Phosphorus (P)
  - Potassium (K)
  - Temperature
  - Humidity
  - pH
  - Rainfall
  - Season

### Top 3 Crop Recommendations
- Provides top 3 best possible crops with confidence scores.

### Crop Suitability Checker
- Checks whether a selected crop is suitable for given soil conditions.

### Resource Optimization Suggestions
- Water management advice.
- Fertilizer suggestions.
- pH correction suggestions.

### Leaf Disease Detection (AI Vision)
- Upload leaf image.
- Detect disease using Gemini Vision.
- Show symptoms.
- Show remedies.
- Generate PDF report.

### User Authentication
- Signup
- Login
- JWT authentication

### Prediction History
- Stores all crop predictions.

### Reports Center
- Export prediction reports as PDF.
- Delete report logs.

### Admin Dashboard
- Model performance analytics.
- Crop statistics.
- Prediction analytics.

---

## Machine Learning Models Used

The project compares multiple machine learning algorithms:

- Logistic Regression
- Decision Tree
- Random Forest
- K-Nearest Neighbors (KNN)
- K-Means Clustering (for data grouping analysis)

### Best Model Selected:
**Random Forest**  
Accuracy: **99.55%**

---

## Tech Stack

### Frontend
- React.js
- Vite
- TypeScript
- Tailwind CSS

### Backend
- FastAPI
- SQLAlchemy
- Pydantic
- Uvicorn

### Database
- SQLite (Local Development)
- PostgreSQL (Production Ready)

### Machine Learning
- Scikit-learn
- Pandas
- NumPy
- Joblib

### AI Services
- Google Gemini API
- Sarvam AI (Text-to-Speech)

---

## Project Architecture

```text
User Input
   ↓
Frontend (React)
   ↓
FastAPI Backend
   ↓
ML Model Prediction
   ↓
Database Storage
   ↓
Reports / History / Analytics
```

---

## Entity Relationship Diagram (ERD)

```text
User
 │
 ├── submits
 │
SoilData
 │
 ├── processed by
 │
MLModel
 │
 ├── generates
 │
Prediction
 │
 ├── creates
 │
Report
 │
 └── recommends
    Crop
```

---

## Folder Structure

```text
OptiCrop/
│
├── backend/
│   ├── app/
│   ├── train_model.py
│   ├── seed_admin.py
│   ├── seed_data.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
│
├── README.md
└── .gitignore
```

---

## Installation & Setup

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file using `.env.example`

Run backend:

```bash
python -m uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

---

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

---

## Model Training

Run:

```bash
python train_model.py
```

This will generate:

- `crop_model.joblib`
- `model_metrics.json`

---

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Crop Prediction

- `POST /api/predict`
- `POST /api/predict/suitability`

### History

- `GET /api/history`

### Reports

- `GET /api/reports`
- `GET /api/reports/{id}`
- `DELETE /api/reports/{id}`
- `GET /api/reports/{id}/download`

### Vision

- `POST /api/vision/analyze`
- `GET /api/vision/history`

### Admin

- `GET /api/admin/models`

---

## Workflow

1. Collect crop dataset.
2. Clean data.
3. Handle missing values.
4. Handle outliers.
5. Perform univariate analysis.
6. Perform bivariate analysis.
7. Perform multivariate analysis.
8. Train multiple ML models.
9. Evaluate performance.
10. Select best model.
11. Build backend APIs.
12. Build frontend UI.
13. Run application.
14. Generate reports.

---

## Future Enhancements

- Weather API integration.
- Fertilizer recommendation system.
- Market price prediction.
- IoT sensor integration.
- Multilingual farmer assistant.
- Real-time drone crop analysis.

---

## Social Impact

- Helps farmers make better crop decisions.
- Reduces farming losses.
- Improves crop productivity.
- Supports sustainable agriculture.

---

## Business Impact

- Increases agricultural profit.
- Improves resource utilization.
- Reduces unnecessary fertilizer and water usage.

---

## Conclusion

OptiCrop is a smart agriculture platform that combines Machine Learning and AI to improve crop production and plant health monitoring.

It provides scientific crop recommendations, disease diagnosis, and optimization suggestions, making agriculture more efficient, profitable, and data-driven.

---

## Author

Developed by: **[Your Name]**  
Project: **OptiCrop – Smart Agricultural Production Optimization Engine**
