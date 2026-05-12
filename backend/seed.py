from app.db.session import SessionLocal
from app.models.user import User, RoleEnum
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        admin_email = "admin@mafos.com"
        existing = db.query(User).filter(User.email == admin_email).first()
        if not existing:
            user = User(
                email=admin_email,
                hashed_password=get_password_hash("password123"),
                full_name="MAFOS Dev Admin",
                role=RoleEnum.DEV_ADMIN,
                is_active=True
            )
            db.add(user)
            db.commit()
            print(f"Created dev admin: {admin_email} / password123")
        else:
            print("Dev admin already exists.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
