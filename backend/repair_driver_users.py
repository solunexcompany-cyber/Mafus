from app.db.session import SessionLocal
from app.models.client import Client
from app.models.user import User, UserRole
from app.core.security import get_password_hash

def repair_driver_users():
    db = SessionLocal()
    clients = db.query(Client).all()
    print(f"Loaded {len(clients)} drivers from database.")
    
    created_count = 0
    processed_usernames = set()
    
    # Pre-populate processed_usernames with existing user logins
    existing_users = db.query(User).all()
    for u in existing_users:
        processed_usernames.add(u.username)
        
    for c in clients:
        # Normalize and check username
        username = c.phone_number.strip()
        if not username:
            continue
            
        if username in processed_usernames:
            print(f"Skipping duplicate username: {username} for driver: {c.full_name}")
            continue
            
        # Check if user already exists for this client_id
        user_by_client = db.query(User).filter(User.client_id == c.id).first()
        if not user_by_client:
            # Create User login for the driver
            new_user = User(
                email=f"{c.national_id}@mafos.com",
                username=username,
                full_name=c.full_name,
                hashed_password=get_password_hash(username),
                role=UserRole.CLIENT,
                vendor_id=c.vendor_id,
                client_id=c.id,
                is_active=True
            )
            db.add(new_user)
            processed_usernames.add(username)
            created_count += 1
            print(f"Created user login for: {c.full_name} (Username: {username})")
            
    if created_count > 0:
        db.commit()
        print(f"Successfully generated {created_count} new driver user logins.")
    else:
        print("All drivers already have user logins. No actions taken.")

if __name__ == "__main__":
    repair_driver_users()
