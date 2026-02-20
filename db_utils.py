from sqlalchemy import inspect, text
from flask_migrate import upgrade
from extensions import db

def check_and_patch_database(app):
    with app.app_context():
        try:
            inspector = inspect(db.engine)
            conn = db.engine.connect()

            # 1. Patch 'Clientes' table (is_active)
            if inspector.has_table("Clientes"):
                columns = [c['name'] for c in inspector.get_columns("Clientes")]
                if "is_active" not in columns:
                    print("--> Patching 'Clientes': Adding missing 'is_active' column...")
                    try:
                        conn.execute(text("ALTER TABLE Clientes ADD COLUMN is_active BOOLEAN DEFAULT 1"))
                        conn.commit()
                    except Exception as e:
                        print(f"--> Failed to patch Clientes: {e}")

            # 2. Create 'verification_codes' if missing
            if not inspector.has_table("verification_codes"):
                print("--> Patching: Creating missing 'verification_codes' table...")
                try:
                    # SQLite syntax compatible
                    conn.execute(text("""
                        CREATE TABLE verification_codes (
                            id INTEGER NOT NULL,
                            email VARCHAR(100) NOT NULL,
                            code VARCHAR(6) NOT NULL,
                            type VARCHAR(20) NOT NULL,
                            created_at DATETIME,
                            expires_at DATETIME NOT NULL,
                            used BOOLEAN,
                            PRIMARY KEY (id)
                        )
                    """))
                    conn.commit()
                except Exception as e:
                    print(f"--> Failed to create verification_codes: {e}")

            # 3. Create 'audit_logs' if missing
            if not inspector.has_table("audit_logs"):
                print("--> Patching: Creating missing 'audit_logs' table...")
                try:
                    conn.execute(text("""
                        CREATE TABLE audit_logs (
                            id INTEGER NOT NULL,
                            id_cliente INTEGER,
                            action VARCHAR(100) NOT NULL,
                            details TEXT,
                            ip_address VARCHAR(50),
                            timestamp DATETIME,
                            PRIMARY KEY (id),
                            FOREIGN KEY(id_cliente) REFERENCES "Clientes" (id_cliente)
                        )
                    """))
                    conn.commit()
                except Exception as e:
                    print(f"--> Failed to create audit_logs: {e}")

            # Close connection explicitly to avoid locks before upgrade
            conn.close()

            # 4. Run Standard Migrations (for anything else)
            print("--> Running Alembic migrations...")
            try:
                upgrade()
                print("--> Database schema synced.")
            except Exception as e:
                print(f"--> Alembic upgrade skipped/failed (expected if DB is partial): {e}")

        except Exception as e:
            print(f"--> Database Check/Patch Critical Error: {e}")
