from sqlalchemy import text
from app.db.session import engine

def update_schema():
    with engine.connect() as conn:
        print("Checking/Updating payments table schema...")
        
        # 1. Add status column to payments (using VARCHAR or Enum)
        try:
            conn.execute(text("ALTER TABLE payments ADD COLUMN status VARCHAR(20) DEFAULT 'approved'"))
            conn.commit()
            print("Added status column to payments.")
        except Exception as e:
            print("Status column in payments might already exist or failed:", e)

        # 2. Add sender_name column to payments
        try:
            conn.execute(text("ALTER TABLE payments ADD COLUMN sender_name VARCHAR(255) NULL"))
            conn.commit()
            print("Added sender_name column to payments.")
        except Exception as e:
            print("sender_name column in payments might already exist or failed:", e)

        # 3. Add receipt_url column to payments
        try:
            conn.execute(text("ALTER TABLE payments ADD COLUMN receipt_url VARCHAR(500) NULL"))
            conn.commit()
            print("Added receipt_url column to payments.")
        except Exception as e:
            print("receipt_url column in payments might already exist or failed:", e)

        # 4. Add rejection_reason column to payments
        try:
            conn.execute(text("ALTER TABLE payments ADD COLUMN rejection_reason VARCHAR(1000) NULL"))
            conn.commit()
            print("Added rejection_reason column to payments.")
        except Exception as e:
            print("rejection_reason column in payments might already exist or failed:", e)

        # 5. Add bank columns to financing_contracts
        for col in ['payment_account_number', 'payment_bank_name', 'payment_account_name']:
            try:
                conn.execute(text(f"ALTER TABLE financing_contracts ADD COLUMN {col} VARCHAR(255) NULL"))
                conn.commit()
                print(f"Added {col} column to financing_contracts.")
            except Exception as e:
                print(f"{col} column in financing_contracts might already exist or failed:", e)

        print("Database schema update complete!")

if __name__ == "__main__":
    update_schema()
