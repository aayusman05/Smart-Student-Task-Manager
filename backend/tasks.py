# backend/tasks.py
from flask import Blueprint, request, jsonify
from flask_login import login_required, current_user
from .models import db, Task
from .priority import PriorityCalculator, TaskType
from datetime import datetime

tasks = Blueprint('tasks', __name__)

@tasks.route('/tasks', methods=['GET'])
@login_required
def get_tasks():
    """Get all tasks for the current user with calculated priorities"""
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    tasks_list = []
    
    for task in tasks:
        calculated_priority = PriorityCalculator.calculate_priority(
            task.deadline, 
            task.task_type,
            task.weight
        )
        
        if task.priority != calculated_priority:
            task.priority = calculated_priority
            db.session.commit()
        
        tasks_list.append({
            'id': task.id,
            'title': task.title,
            'description': task.description,
            'subject': task.subject,
            'task_type': task.task_type,
            'weight': task.weight,
            'deadline': task.deadline.isoformat(),
            'priority': task.priority,
            'priority_color': PriorityCalculator.get_priority_color(task.priority),
            'recommendation': PriorityCalculator.get_task_recommendation(task),
            'status': task.status,
            'created_at': task.created_at.isoformat()
        })
    
    priority_order = {'critical': 0, 'overdue': 1, 'high': 2, 'medium': 3, 'low': 4}
    tasks_list.sort(key=lambda x: (priority_order.get(x['priority'], 5), x['deadline']))
    
    return jsonify(tasks_list)

@tasks.route('/tasks', methods=['POST'])
@login_required
def create_task():
    """Create a new task with automatic priority calculation"""
    data = request.get_json()
    
    required = ['title', 'deadline']
    for field in required:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400

    try:
        deadline = datetime.fromisoformat(data['deadline'])
    except:
        return jsonify({'error': 'Invalid deadline format. Use YYYY-MM-DDTHH:MM:SS'}), 400

    task_type = data.get('task_type', 'assignment').lower()
    
    valid_types = [t.value for t in TaskType]
    if task_type not in valid_types:
        return jsonify({'error': f'Invalid task type. Must be one of: {valid_types}'}), 400
    
    weight = PriorityCalculator.get_default_weight(task_type)

    priority = PriorityCalculator.calculate_priority(deadline, task_type, weight)

    new_task = Task(
        user_id=current_user.id,
        title=data['title'],
        description=data.get('description', ''),
        subject=data.get('subject', ''),
        task_type=task_type,
        weight=weight,
        deadline=deadline,
        priority=priority,
        # New tasks should always start pending; completion is an update action.
        status='pending'
    )
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify({
        'message': 'Task created successfully',
        'task_id': new_task.id,
        'priority': priority,
        'recommendation': PriorityCalculator.get_task_recommendation(new_task)
    }), 201

@tasks.route('/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    """Update a task"""
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data = request.get_json()
    
    if 'title' in data:
        task.title = data['title']
    if 'description' in data:
        task.description = data['description']
    if 'subject' in data:
        task.subject = data['subject']
    if 'task_type' in data:
        task.task_type = data['task_type'].lower()
    task.weight = PriorityCalculator.get_default_weight(task.task_type)
    
    if 'deadline' in data:
        try:
            task.deadline = datetime.fromisoformat(data['deadline'])
        except:
            return jsonify({'error': 'Invalid deadline format'}), 400
    
    task.priority = PriorityCalculator.calculate_priority(
        task.deadline, 
        task.task_type,
        task.weight
    )
    
    if 'status' in data:
        task.status = data['status']

    db.session.commit()
    
    return jsonify({
        'message': 'Task updated',
        'priority': task.priority,
        'recommendation': PriorityCalculator.get_task_recommendation(task)
    })

@tasks.route('/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    """Delete a task"""
    task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    db.session.delete(task)
    db.session.commit()

    return jsonify({'message': 'Task deleted'})

@tasks.route('/tasks/analytics', methods=['GET'])
@login_required
def get_task_analytics():
    """Get analytics about tasks by type and priority"""
    tasks = Task.query.filter_by(user_id=current_user.id).all()
    
    analytics = {
        'by_type': {},
        'by_priority': {
            'critical': 0,
            'overdue': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        },
        'total_tasks': len(tasks),
        'completed': sum(1 for t in tasks if t.status == 'completed'),
        'pending': sum(1 for t in tasks if t.status == 'pending')
    }
    
    for task in tasks:
        if task.task_type not in analytics['by_type']:
            analytics['by_type'][task.task_type] = 0
        analytics['by_type'][task.task_type] += 1
        
        if task.priority in analytics['by_priority']:
            analytics['by_priority'][task.priority] += 1
    
    return jsonify(analytics)

@tasks.route('/tasks/study-plan', methods=['GET'])
@login_required
def get_study_plan():
    """Get a recommended study plan based on tasks"""
    tasks = Task.query.filter_by(
        user_id=current_user.id, 
        status='pending'
    ).all()
    
    priority_order = {'critical': 0, 'overdue': 1, 'high': 2, 'medium': 3, 'low': 4}
    tasks.sort(key=lambda x: (
        priority_order.get(
            PriorityCalculator.calculate_priority(x.deadline, x.task_type, x.weight), 
            5
        ),
        x.deadline
    ))
    
    study_plan = []
    for i, task in enumerate(tasks[:5]):
        study_plan.append({
            'rank': i + 1,
            'title': task.title,
            'subject': task.subject,
            'task_type': task.task_type,
            'deadline': task.deadline.isoformat(),
            'priority': PriorityCalculator.calculate_priority(
                task.deadline, task.task_type, task.weight
            ),
            'recommendation': PriorityCalculator.get_task_recommendation(task),
            'estimated_hours': task.weight * 0.5
        })
    
    return jsonify(study_plan)

@tasks.route('/reminders', methods=['GET'])
@login_required
def get_reminders():
    """Return tasks with deadlines within the next 24 hours."""
    from datetime import timedelta
    now = datetime.now()
    soon = now + timedelta(hours=24)
    tasks = Task.query.filter(
        Task.user_id == current_user.id,
        Task.status == 'pending',
        Task.deadline <= soon,
        Task.deadline >= now
    ).all()
    reminders = []
    for task in tasks:
        reminders.append({
            'id': task.id,
            'title': task.title,
            'deadline': task.deadline.isoformat()
        })
    return jsonify(reminders)