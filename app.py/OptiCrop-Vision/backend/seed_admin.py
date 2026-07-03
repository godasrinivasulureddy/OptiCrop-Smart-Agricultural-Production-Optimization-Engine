import os
import sys

# Ensure backend directory is in python load path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models import User, Crop
from app.auth import get_password_hash

# Define some initial agricultural seed crops
SEED_CROPS = [
    {
        "name": "Rice", "min_N": 60, "max_N": 99, "min_P": 35, "max_P": 60, "min_K": 35, "max_K": 45,
        "min_temp": 20, "max_temp": 27, "min_humidity": 75, "max_humidity": 85, "min_ph": 5.5, "max_ph": 7.0,
        "min_rainfall": 150, "max_rainfall": 250, "optimal_season": "Kharif"
    },
    {
        "name": "Maize", "min_N": 80, "max_N": 120, "min_P": 30, "max_P": 50, "min_K": 25, "max_K": 35,
        "min_temp": 18, "max_temp": 30, "min_humidity": 55, "max_humidity": 70, "min_ph": 5.5, "max_ph": 7.0,
        "min_rainfall": 60, "max_rainfall": 110, "optimal_season": "Kharif"
    },
    {
        "name": "Chickpea", "min_N": 20, "max_N": 50, "min_P": 50, "max_P": 70, "min_K": 70, "max_K": 90,
        "min_temp": 15, "max_temp": 25, "min_humidity": 14, "max_humidity": 20, "min_ph": 6.0, "max_ph": 8.0,
        "min_rainfall": 50, "max_rainfall": 90, "optimal_season": "Rabi"
    },
    {
        "name": "Watermelon", "min_N": 80, "max_N": 110, "min_P": 10, "max_P": 25, "min_K": 40, "max_K": 60,
        "min_temp": 22, "max_temp": 32, "min_humidity": 80, "max_humidity": 90, "min_ph": 6.0, "max_ph": 7.0,
        "min_rainfall": 40, "max_rainfall": 60, "optimal_season": "Zaid"
    },
    {
        "name": "Apple", "min_N": 10, "max_N": 35, "min_P": 120, "max_P": 145, "min_K": 190, "max_K": 210,
        "min_temp": 15, "max_temp": 25, "min_humidity": 90, "max_humidity": 95, "min_ph": 5.5, "max_ph": 6.5,
        "min_rainfall": 100, "max_rainfall": 130, "optimal_season": "Whole Year"
    }
]

def seed_database():
    print("Initializing SQLite Database Tables...")
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # 1. Create default admin if not existing
        admin_email = "admin@opticrop.org"
        admin_exists = db.query(User).filter(User.email == admin_email).first()
        
        if not admin_exists:
            print(f"Creating administrative account: {admin_email} (password: admin123)")
            hashed = get_password_hash("admin123")
            admin_user = User(
                email=admin_email,
                hashed_password=hashed,
                full_name="Chief Agronomist Admin",
                is_admin=True
            )
            db.add(admin_user)
            db.commit()
        else:
            print(f"Admin account '{admin_email}' already exists.")

        # 2. Add seed crops
        for crop_data in SEED_CROPS:
            crop_exists = db.query(Crop).filter(Crop.name == crop_data["name"]).first()
            if not crop_exists:
                print(f"Adding catalog seed crop: {crop_data['name']}")
                new_crop = Crop(**crop_data)
                db.add(new_crop)
            else:
                print(f"Catalog crop '{crop_data['name']}' already seeded.")
        
        db.commit()
        print("Database seeding completed successfully.")
        
    except Exception as e:
        db.rollback()
        print(f"Database seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
