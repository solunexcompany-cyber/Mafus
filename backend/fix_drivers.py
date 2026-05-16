from app.db.session import SessionLocal
from app.models.client import Client
from app.models.vendor import Vendor
from app.models.user import User, UserRole

def fix_drivers():
    db = SessionLocal()
    clients = db.query(Client).all()
    vendors = db.query(Vendor).all()
    
    if not vendors:
        print("No vendors found to assign drivers to.")
        return

    default_vendor_id = vendors[0].id
    print(f"Using default vendor: {vendors[0].business_name} ({default_vendor_id})")

    for c in clients:
        changed = False
        if not c.vendor_id:
            c.vendor_id = default_vendor_id
            changed = True
            print(f"Fixed vendor_id for driver: {c.full_name}")
        
        if changed:
            db.add(c)
    
    db.commit()
    print("Repair complete.")

if __name__ == "__main__":
    fix_drivers()
