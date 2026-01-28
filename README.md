# Thalium Bank Application

## Overview
This is a Flask-based banking application refactored for better organization, scalability, and maintainability.

## Structure
- `app/`: Main application package.
    - `models/`: Database models (Data Access Layer).
    - `services/`: Business logic.
    - `routes/`: Flask blueprints (Presentation Layer).
    - `utils/`: Utility functions.
    - `config.py`: Configuration settings.
    - `database.py`: Database connection handling.
- `run.py`: Entry point for the application.
- `setup_db.py`: Script to initialize the SQLite database.
- `tests/`: Unit and integration tests.

## Setup
1. Install dependencies:
   ```bash
   pip install flask
   ```
2. Initialize the database:
   ```bash
   python setup_db.py
   ```
3. Run the application:
   ```bash
   python run.py
   ```

## Testing
Run the tests using:
```bash
python -m unittest discover tests
```

## Features
- User Registration & Login
- Account Balance Check
- Deposits & Withdrawals
- Internal Transfers
- Boleto Payment
- Loan Requests
- Transaction History
- Credit Cards View

## Technology Stack
- Python 3
- Flask
- SQLite (Migration from MySQL)
