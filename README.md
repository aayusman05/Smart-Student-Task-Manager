# Student Task Manager

A Flask-based web app for students to manage assignments and exams with automatic priority calculation, calendar planning, and weekly workload insights.

## Features

- User authentication (register, login, logout)
- Task CRUD (create, edit, delete)
- Automatic priority calculation based on:
	- due date/time
	- task type (exam, assignment, project, and more)
	- automatic type-based weight mapping
- Dashboard with:
	- summary metric cards
	- urgent tasks
	- missed deadlines
	- all pending tasks
	- completed tasks
- Calendar page with:
	- date-wise task view
	- selectable dates
	- today shortcut button
	- task indicator dots on day cells
	- previous/next month spillover dates
- Weekly Summary page with:
	- summary cards
	- subject-wise workload progress bars
	- weekly due-task list
- Subject-wise task grouping page

## Tech Stack

- Backend: Flask, Flask-Login, Flask-SQLAlchemy
- Frontend: Jinja templates, vanilla JavaScript modules, CSS
- Database: SQLite by default (configurable through `DATABASE_URL`)

## Project Structure

```text
backend/
	app.py            # Flask app factory + blueprint registration
	auth.py           # Authentication API routes
	tasks.py          # Task API routes and analytics
	views.py          # Page routes (dashboard, calendar, summary, subjects)
	models.py         # SQLAlchemy models (User, Task)
	priority.py       # Priority and recommendation logic

frontend/
	templates/        # Jinja page templates
	static/
		css/style.css   # Shared app styles
		js/
			main.js       # Entry point + page initializers
			modules/      # API/session/task UI helpers
			pages/        # Page-specific JS (dashboard/calendar/summary/etc.)

run.py              # Local app runner
init_db.py          # DB initialization helper
requirements.txt    # Python dependencies
docker-compose.yml  # Optional MySQL service
```

## Quick Start (Local)

### 1. Create and activate a virtual environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure environment variables

Create `.env` from `.env.example`:

```bash
cp .env.example .env
```

Minimum required variable:

- `SECRET_KEY` (required)

Optional database variables:

- `SQLITE_DB_PATH` (defaults to `student_task_manager.db`)
- `DATABASE_URL` (overrides SQLite path entirely)

### 4. Initialize the database

```bash
python init_db.py
```

### 5. Run the app

```bash
python run.py
```

Open `http://127.0.0.1:5000` in your browser.

## API Overview

### Auth

- `POST /register`
- `POST /login`
- `POST /logout`

### Tasks

- `GET /tasks`
- `POST /tasks`
- `PUT /tasks/<task_id>`
- `DELETE /tasks/<task_id>`
- `GET /tasks/analytics`
- `GET /tasks/study-plan`
- `GET /reminders`

## Task Types and Automatic Weights

The app auto-assigns a weight based on `task_type` when creating/updating tasks.

Current defaults:

- `exam`: 10
- `test`: 9
- `assignment`: 6
- `homework`: 5
- `project`: 7
- `lab_report`: 6
- `presentation`: 6
- `reading`: 3
- `group_work`: 7
- `extra_credit`: 2

## Notes

- New tasks are created with `pending` status by default.
- Priority labels are recalculated on fetch/update.
- Sidebar navigation includes Dashboard, Add Task, Subjects, Calendar, and Summary.

## Optional: Start MySQL with Docker

If you prefer MySQL for local development:

```bash
docker compose up -d
```

Then set a compatible `DATABASE_URL` in `.env`.

