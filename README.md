# 🌱 OptiCrop – Smart Agricultural Production Optimization Engine

## 📌 Project Overview

OptiCrop is an intelligent agriculture support system designed to help farmers and agricultural users make better crop decisions using **Machine Learning** and **AI-powered leaf disease diagnosis**.

The system analyzes **soil nutrients** and **environmental conditions** to recommend the most suitable crop, check crop suitability, and provide optimization suggestions for better yield.

It also includes **leaf disease detection** using Google Gemini Vision AI.

---

## 🎯 Main Goal

The main goal of OptiCrop is to:

✅ Improve crop selection accuracy  
✅ Reduce farming losses  
✅ Increase agricultural productivity  
✅ Help farmers make data-driven decisions  
✅ Detect plant diseases early  
✅ Provide resource optimization suggestions  

---

## 🚀 Key Features

### 🌾 Crop Recommendation System
- Predict best crop using:
  - Nitrogen (N)
  - Phosphorus (P)
  - Potassium (K)
  - Temperature
  - Humidity
  - pH
  - Rainfall
  - Season

### 📊 Multi-Model Machine Learning
Supports:
- Logistic Regression
- Decision Tree
- Random Forest
- K-Nearest Neighbors (KNN)
- K-Means Clustering

### 🏆 Best Model Selection
- Trains all models
- Compares performance
- Selects best model automatically

### 🔍 Top 3 Crop Predictions
Shows:
- Best crop
- Alternative crops
- Confidence scores

### 🌱 Crop Suitability Checker
Check whether a selected crop is:
- Suitable
- Partially Suitable
- Not Suitable

with reasons.

### 💧 Resource Optimization
Provides:
- Water suggestions
- Fertilizer suggestions
- pH correction advice

### 🍃 Leaf Disease Detection (AI Vision)
Upload crop leaf image to:
- Detect disease
- Identify symptoms
- Get remedies
- Get prevention advice

### 📜 Reports & Export
- Generate PDF reports
- Download reports
- Maintain prediction history

### 👨‍💼 Admin Dashboard
- User analytics
- Prediction analytics
- Model comparison
- Disease analysis

---

## 🛠 Technologies Used

### Backend
- FastAPI ⚡
- Python 🐍
- SQLAlchemy
- Pydantic
- JWT Authentication
- Uvicorn

### Frontend
- React.js ⚛
- Vite
- Tailwind CSS
- TypeScript

### Database
- SQLite (Local)
- PostgreSQL (Production)

### Machine Learning
- Scikit-learn
- Pandas
- NumPy
- Joblib

### AI Services
- Google Gemini API
- Sarvam AI TTS
- OpenWeather API

### Reporting
- ReportLab (PDF generation)

---

## 🧠 Machine Learning Workflow

```text
Dataset Collection
        ↓
Data Cleaning
        ↓
Feature Engineering
        ↓
Model Training
        ↓
Model Evaluation
        ↓
Best Model Selection
        ↓
Prediction
        ↓
Report Generation
```

---

## 🏗 Project Structure

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

## ⚙ Installation

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/OptiCrop.git
cd OptiCrop
```

---

## Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Create `.env` file:

```env
DATABASE_URL=sqlite:///./opticrop.db
SECRET_KEY=your_secret_key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440
```

Run backend:

```bash
python -m uvicorn app.main:app --reload
```

Backend runs at:

```text
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

---

## 🧪 Train Machine Learning Model

Run:

```bash
python train_model.py
```

This will generate:

✅ crop_model.joblib  
✅ model_metrics.json  

---

## 🔑 Authentication

OptiCrop uses JWT Authentication.

Features:
- Register
- Login
- Protected Routes
- Admin Access

---

## 📡 Main API Routes

### Auth
- `/api/auth/register`
- `/api/auth/login`

### Prediction
- `/api/predict`
- `/api/predict/suitability`

### History
- `/api/history`

### Reports
- `/api/reports`
- `/api/reports/{id}`
- `/api/reports/{id}/download`

### Vision AI
- `/api/vision/analyze`

### Admin
- `/api/admin/models`

---

## 📈 Model Performance

Best performing model:

🏆 **Random Forest**

Accuracy:

**99.55%**

Used as final production model.

---

## 🌍 Future Improvements

- Weather forecasting integration
- Market price prediction
- Fertilizer recommendation
- IoT sensor integration
- Multilingual farmer assistant
- Real-time crop monitoring

---

## 🎓 Academic Purpose

This project was developed as part of an academic smart agriculture system to improve farming decisions using Artificial Intelligence and Machine Learning.

---

## 👨‍💻 Author

**Project Name:** OptiCrop  
**Domain:** Smart Agriculture  
**Type:** Full Stack Machine Learning Application

---

## ⭐ Final Note

OptiCrop is a complete intelligent farming assistant built to bridge the gap between traditional agriculture and modern AI-driven precision farming.

**"Better Soil Analysis → Better Crop Selection → Better Yield → Better Future"** 🌱
