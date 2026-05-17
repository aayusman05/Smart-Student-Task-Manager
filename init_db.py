from sqlalchemy.exc import OperationalError

print("Starting database initialization...")

try:
    from backend import create_app, db

    print("Successfully imported create_app and db")

    app = create_app()
    print("Successfully created app")

    with app.app_context():
        print("Creating database tables...")
        try:
            db.create_all()
        except OperationalError as e:
            print(f"❌ Database connection error: {e}")
            print("\nTroubleshooting tips:")
            print("1. Check your DATABASE_URL value if you set one")
            print("2. Check SQLITE_DB_PATH in .env (default is student_task_manager.db)")
            print("3. Ensure the app has permission to write in the project directory")
        else:
            print("✅ Database tables created successfully!")

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("\nTroubleshooting tips:")
    print("1. Make sure all your backend files exist")
    print("2. Check that backend/__init__.py has create_app() and db defined")
    print("3. Make sure you're running this from the project root directory")
