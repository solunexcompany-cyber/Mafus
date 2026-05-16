import psycopg2
from app.core.config import settings

def fix_db():
    conn = psycopg2.connect("postgresql://mafos_user:mafos123@127.0.0.1:5433/mafos_db")
    cur = conn.cursor()
    
    print("Adding missing columns to clients table...")
    try:
        cur.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS nickname VARCHAR;")
        cur.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS dob VARCHAR;")
        cur.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS address VARCHAR;")
        cur.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS city_of_duty VARCHAR;")
        cur.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS next_of_kin JSONB;")
        conn.commit()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_db()
