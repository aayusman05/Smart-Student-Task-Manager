from flask import Blueprint, render_template
from flask_login import current_user, login_required

views = Blueprint('views', __name__)

@views.route('/')
def index():
    return render_template('index.html')

@views.route('/login')
def login_page():
    return render_template('index.html')

@views.route('/register')
def register_page():
    return render_template('register.html')

@views.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html', user=current_user)

@views.route('/task-form')
def task_form():
    return render_template('task-form.html')

@views.route('/weekly-summary')
@login_required
def weekly_summary():
    return render_template('weekly-summary.html', user=current_user)

@views.route('/calendar')
@login_required
def calendar_page():
    return render_template('calendar.html', user=current_user)

@views.route('/missed-tasks')
@login_required
def missed_tasks_page():
    return render_template('missed-tasks.html', user=current_user)

@views.route('/subjects')
@login_required
def subjects_page():
    return render_template('subjects.html', user=current_user)
