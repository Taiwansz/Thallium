import unittest
import os
from app import app, db
from sqlalchemy import text
from db_utils import check_and_patch_database

class DbPatchTestCase(unittest.TestCase):
    def setUp(self):
        self.db_path = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'test_patch.db')
        self.db_uri = f'sqlite:///{self.db_path}'
        app.config['SQLALCHEMY_DATABASE_URI'] = self.db_uri
        app.config['TESTING'] = True
        self.app = app.test_client()

        # Create initial DB manually without new tables
        with app.app_context():
            db.create_all() # This creates based on current models, so it creates everything.
            # We must DROP the table we want to test patching for.
            with db.engine.connect() as conn:
                conn.execute(text("DROP TABLE verification_codes"))
                conn.commit()

    def tearDown(self):
        if os.path.exists(self.db_path):
            os.remove(self.db_path)

    def test_patch_verification_codes(self):
        # Run patching logic
        check_and_patch_database(app)

        with app.app_context():
            from sqlalchemy import inspect
            inspector = inspect(db.engine)
            self.assertTrue(inspector.has_table("verification_codes"))

if __name__ == '__main__':
    unittest.main()
