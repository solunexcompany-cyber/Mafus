from app.db.session import SessionLocal
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def seed_db():
    db = SessionLocal()
    try:
        admin_email = "admin@mafos.com"
        existing = db.query(User).filter(User.username == admin_email).first()
        if not existing:
            user = User(
                username=admin_email,
                email=admin_email,
                full_name="MAFOS Dev Admin",
                hashed_password=get_password_hash("password123"),
                role=UserRole.SUPER_ADMIN,
                is_active=True
            )
            db.add(user)
            db.commit()
            print("✅ Created dev admin successfully!")
        else:
            print("ℹ️ Dev admin already exists.")
    except Exception as e:
        print(f"❌ Seeding failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
