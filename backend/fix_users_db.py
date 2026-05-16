import psycopg2

def fix_users_db():
    conn = psycopg2.connect("postgresql://mafos_user:mafos123@127.0.0.1:5433/mafos_db")
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR;")
        conn.commit()
        print("Success: phone_number column added to users table.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_users_db()
