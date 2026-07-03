import requests
import uuid

API = "http://localhost:8000/api"
test_email = f"dashboard_{uuid.uuid4().hex[:6]}@example.com"
test_password = "password123"

# Register & Login
requests.post(f"{API}/auth/register", json={"email": test_email, "password": test_password, "full_name": "Dashboard Tester"})
r = requests.post(f"{API}/auth/login", json={"email": test_email, "password": test_password})
token = r.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 1. Create a Tabular Prediction
pred_data = {
    "N": 90, "P": 42, "K": 43,
    "temperature": 20.8, "humidity": 82.0, "ph": 6.5,
    "rainfall": 202.9, "season": "Rainy"
}
requests.post(f"{API}/predict", headers=headers, json=pred_data)

# 2. Create a Leaf Diagnosis
with open("dummy.jpg", "wb") as f:
    f.write(b"\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x01\x00H\x00H\x00\x00\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t")

with open("dummy.jpg", "rb") as f:
    files = {"file": ("dummy.jpg", f, "image/jpeg")}
    requests.post(f"{API}/vision/analyze", headers=headers, files=files)

# 3. Fetch Dashboard Summary
r = requests.get(f"{API}/dashboard/summary", headers=headers)
print("Dashboard Data:", r.text)
