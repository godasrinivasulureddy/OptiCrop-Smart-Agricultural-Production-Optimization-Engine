import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier
from sklearn.neighbors import KNeighborsClassifier
from sklearn.cluster import KMeans
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import joblib
import os
import json
import datetime

def train_and_save_model():
    dataset_path = os.path.join(os.path.dirname(__file__), "..", "datasets", "Crop_recommendation.csv")
    model_output_path = os.path.join(os.path.dirname(__file__), "app", "crop_model.joblib")
    metrics_output_path = os.path.join(os.path.dirname(__file__), "app", "model_metrics.json")

    if not os.path.exists(dataset_path):
        print(f"Error: Dataset not found at {dataset_path}")
        return

    print("Loading dataset...")
    df = pd.read_csv(dataset_path)

    # 1. Clean Data (Check missing/duplicates)
    initial_len = len(df)
    df = df.dropna()
    df = df.drop_duplicates()
    print(f"Dataset cleaned. Kept {len(df)} out of {initial_len} records.")

    # 2. Add Season feature based on crop labels
    season_mapping = {
        "rice": "Kharif", "maize": "Kharif", "chickpea": "Rabi",
        "kidneybeans": "Rabi", "pigeonpeas": "Kharif", "mothbeans": "Kharif",
        "mungbean": "Kharif", "blackgram": "Kharif", "lentil": "Rabi",
        "pomegranate": "Whole Year", "banana": "Whole Year", "mango": "Whole Year",
        "grapes": "Whole Year", "watermelon": "Zaid", "muskmelon": "Zaid",
        "apple": "Whole Year", "orange": "Whole Year", "papaya": "Whole Year",
        "coconut": "Whole Year", "cotton": "Kharif", "jute": "Kharif", "coffee": "Whole Year"
    }
    df["season"] = df["label"].map(season_mapping).fillna("Kharif")

    X = df[["N", "P", "K", "temperature", "humidity", "ph", "rainfall", "season"]]
    y = df["label"]

    # 3. Split Dataset
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # 4. Preprocessing Pipeline
    continuous_features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    categorical_features = ["season"]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), continuous_features),
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features)
        ]
    )

    # 5. Define Models
    models = {
        "Logistic Regression": LogisticRegression(max_iter=2000, random_state=42),
        "Decision Tree": DecisionTreeClassifier(random_state=42),
        "Random Forest": RandomForestClassifier(n_estimators=100, random_state=42),
        "KNN": KNeighborsClassifier(n_neighbors=5)
    }

    # Optional K-Means for clustering (Unsupervised analysis)
    # Using only continuous features for K-Means to find agricultural clusters
    scaler_kmeans = StandardScaler()
    X_kmeans = scaler_kmeans.fit_transform(df[continuous_features])
    kmeans = KMeans(n_clusters=4, random_state=42, n_init=10)
    kmeans.fit(X_kmeans)
    kmeans_inertia = kmeans.inertia_
    print(f"K-Means Clustering completed. Inertia: {kmeans_inertia:.2f}")

    # 6. Train and Evaluate Models
    results = {}
    best_model_name = None
    best_model_pipeline = None
    best_accuracy = 0

    print("Training and evaluating models...")
    for name, classifier in models.items():
        pipeline = Pipeline(steps=[
            ("preprocessor", preprocessor),
            ("classifier", classifier)
        ])
        
        # Train
        pipeline.fit(X_train, y_train)
        
        # Predict
        y_pred = pipeline.predict(X_test)
        
        # Metrics
        acc = accuracy_score(y_test, y_pred)
        prec = precision_score(y_test, y_pred, average='weighted', zero_division=0)
        rec = recall_score(y_test, y_pred, average='weighted', zero_division=0)
        f1 = f1_score(y_test, y_pred, average='weighted', zero_division=0)
        
        results[name] = {
            "Accuracy": round(acc, 4),
            "Precision": round(prec, 4),
            "Recall": round(rec, 4),
            "F1_Score": round(f1, 4)
        }
        
        print(f"[{name}] Acc: {acc:.4f} | F1: {f1:.4f}")
        
        if acc > best_accuracy:
            best_accuracy = acc
            best_model_name = name
            best_model_pipeline = pipeline

    # 7. Save Best Model
    print(f"\nBest Model: {best_model_name} (Accuracy: {best_accuracy:.4f})")
    joblib.dump(best_model_pipeline, model_output_path)
    print(f"Best model pipeline saved to {model_output_path}")

    # 8. Save Metrics Metadata
    metrics_data = {
        "training_date": datetime.datetime.utcnow().isoformat() + "Z",
        "dataset_records": len(df),
        "best_model": best_model_name,
        "best_accuracy": best_accuracy,
        "models": results,
        "kmeans_inertia": kmeans_inertia
    }
    
    with open(metrics_output_path, "w") as f:
        json.dump(metrics_data, f, indent=4)
    print(f"Model metrics saved to {metrics_output_path}")

if __name__ == "__main__":
    train_and_save_model()