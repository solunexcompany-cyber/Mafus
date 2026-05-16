import psycopg2

def fix_clients_manager():
    conn = psycopg2.connect("postgresql://mafos_user:mafos123@127.0.0.1:5433/mafos_db")
    cur = conn.cursor()
    try:
        cur.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS manager_id VARCHAR REFERENCES users(id);")
        conn.commit()
        print("Success: manager_id column added to clients table.")
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    fix_clients_manager()
