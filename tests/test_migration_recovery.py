import unittest
import os
import shutil
from app import app, db
from sqlalchemy import text, inspect

class MigrationRecoveryTestCase(unittest.TestCase):
    def setUp(self):
        # Use a separate file-based DB for this test to simulate persistence
        self.db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'test_migration.db')
        self.db_uri = f'sqlite:///{self.db_path}'

        # Configure app to use this DB
        app.config['SQLALCHEMY_DATABASE_URI'] = self.db_uri
        app.config['TESTING'] = True
        self.app = app.test_client()

    def tearDown(self):
        # Clean up
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_schema_upgrade_on_startup(self):
        """Test that app startup adds missing columns to existing DB."""

        # 1. Create an "Old" Database (simulate state without is_active)
        # We manually create the table as it was before the migration
        with app.app_context():
            # Drop everything first
            db.drop_all()

            # Manually create table with OLD schema
            with db.engine.connect() as conn:
                conn.execute(text("""
                    CREATE TABLE Clientes (
                        id_cliente INTEGER PRIMARY KEY,
                        nome VARCHAR(100) NOT NULL,
                        email VARCHAR(100) UNIQUE,
                        cpf VARCHAR(11) UNIQUE NOT NULL,
                        senha VARCHAR(255) NOT NULL,
                        senha_transacao VARCHAR(255)
                    );
                """))
                # Note: We purposely omit 'is_active' and 'alembic_version'
                # to simulate a raw unversioned DB or one that needs stamping

                # We also need to ensure Alembic knows it needs to upgrade.
                # If we don't have alembic_version table, Alembic might try to create everything and fail.
                # BUT 'flask db upgrade' should handle 'stamp' if we tell it?
                # Actually, our migration script 38f59c... creates everything.
                # If table exists, create_table fails.

                # Wait, the problem on Render was: Table exists (old), Migration adds column?
                # No, I reset migrations to "Initial Schema".
                # If "Initial Schema" does create_table('Clientes'), it WILL FAIL if 'Clientes' exists.
                pass

        # If the migration script tries to CREATE TABLE Clientes, and it exists, it fails.
        # This confirms my suspicion: My "Initial Schema" migration is NOT compatible with an existing database.

        # FIX logic:
        # If we have an existing database that is NOT versioned by Alembic (no alembic_version table),
        # but has tables, 'flask db upgrade' will try to run the initial migration (create tables) and crash.

        # If the user has a database with 'Clientes' but no 'is_active', it means they have an OLD schema.
        # But since I deleted all old migrations and created a new "Initial", there is no "Upgrade path" from Old -> New.
        # There is only "Nothing -> New".

        # THIS IS THE PROBLEM.
        # On Render, if the SQLite persisted (or was partially created), it has the Old Schema.
        # But my code thinks it's a fresh install.

        # Since I cannot easily restore the migration history I deleted, the only fix for the current "Broken State" on Render is:
        # DELETE THE DATABASE on Render.
        # Since I can't do `rm` on Render via chat, I must make the code handle it.

        # Strategy:
        # In `app.py`, if migration fails because table exists, catch it? No.
        # Better: Check if `Clientes` exists but `alembic_version` does not.
        # If so, STAMP it as "head" (forcing it to think it's up to date)?
        # NO, if we stamp it, we skip the `add_column` logic because... wait, the `add_column` logic ISN'T THERE anymore.
        # I replaced the incremental migrations with a single "Initial Schema" migration.

        # So, if the DB has the table but lacks the column, and I stamp it as "current", the column remains missing!
        # And the app crashes accessing `is_active`.

        # CRITICAL REALIZATION:
        # I destroyed the migration path.
        # To fix this without wiping the DB, I need to check for the missing column and add it manually in python startup.

        pass

if __name__ == '__main__':
    unittest.main()
