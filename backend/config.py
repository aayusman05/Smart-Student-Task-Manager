import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()  # load variables from .env

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY')
    BASE_DIR = Path(__file__).resolve().parent.parent
    SQLITE_DB_PATH = os.getenv("SQLITE_DB_PATH", str(BASE_DIR / "student_task_manager.db"))

    # Allow overriding with DATABASE_URL, defaulting to local SQLite.
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", f"sqlite:///{SQLITE_DB_PATH}")
    SQLALCHEMY_TRACK_MODIFICATIONS = False