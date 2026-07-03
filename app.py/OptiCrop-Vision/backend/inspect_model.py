import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "app", "crop_model.joblib")
model = joblib.load(MODEL_PATH)
print("Model type:", type(model))
if hasattr(model, "named_steps"):
    print("Steps:", list(model.named_steps.keys()))
    clf = model.named_steps.get("classifier") or model.named_steps.get("model")
    print("Classifier type:", type(clf))
