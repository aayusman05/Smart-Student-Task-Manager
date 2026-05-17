# SQLite Migration TODO

1. [x] Switch SQLAlchemy default database URI to SQLite (`backend/config.py`).
2. [x] Remove MySQL-only dependency (`pymysql`) from `requirements.txt`.
3. [x] Update environment templates for SQLite (`.env.example`, `.env`).
4. [x] Update database init guidance for SQLite (`init_db.py`).
5. [x] Install/update dependencies: `pip install -r requirements.txt`.
6. [x] Initialize local database: `python init_db.py`.
7. [ ] Start app and verify flows: register, login, create task, edit task.
8. [ ] (Optional) Retire MySQL docker setup if no longer needed (`docker-compose.yml`).
