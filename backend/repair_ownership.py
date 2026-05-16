from app.db.session import SessionLocal
from app.models.client import Client
from app.models.user import User, UserRole

def repair_ownership():
    db = SessionLocal()
    clients = db.query(Client).all()
    
    for c in clients:
        if not c.manager_id:
            # Find the first manager in this vendor
            manager = db.query(User).filter(
                User.vendor_id == c.vendor_id, 
                User.role == UserRole.MASTER_ADMIN
            ).first()
            
            if manager:
                c.manager_id = manager.id
                print(f"Assigned driver {c.full_name} to manager {manager.full_name}")
                db.add(c)
    
    db.commit()
    print("Ownership repair complete.")

if __name__ == "__main__":
    repair_ownership()
