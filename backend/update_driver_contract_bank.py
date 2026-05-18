from sqlalchemy import text
from app.db.session import engine

def update_test_contract():
    with engine.connect() as conn:
        print("Populating bank account details on test driver contract...")
        # Get active contract for driver (client) Abubakar Shuaibu (or any active contract)
        result = conn.execute(text("SELECT id FROM financing_contracts WHERE status = 'ACTIVE' LIMIT 1")).first()
        if result:
            contract_id = result[0]
            conn.execute(text(
                "UPDATE financing_contracts SET "
                "payment_bank_name = 'Kuda Microfinance Bank', "
                "payment_account_number = '2034857643', "
                "payment_account_name = 'MAFOS Ventures Ltd (Kano Central)' "
                "WHERE id = :cid"
            ), {"cid": contract_id})
            conn.commit()
            print(f"Successfully populated bank details for active contract {contract_id}!")
        else:
            print("No active contracts found to update.")

if __name__ == "__main__":
    update_test_contract()
