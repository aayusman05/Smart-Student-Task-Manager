# backend/priority.py
from datetime import datetime, timedelta
from enum import Enum

class TaskType(Enum):
    EXAM = 'exam'
    TEST = 'test'
    ASSIGNMENT = 'assignment'
    HOMEWORK = 'homework'
    PROJECT = 'project'
    LAB_REPORT = 'lab_report'
    PRESENTATION = 'presentation'
    READING = 'reading'
    GROUP_WORK = 'group_work'
    EXTRA_CREDIT = 'extra_credit'

class PriorityCalculator:
    """
    Calculates task priority based on:
    - Task type (different types have different urgency levels)
    - Days until deadline
    - Task weight/importance (1-10 scale)
    """
    
    # Define urgency multipliers for different task types
    # Higher multiplier = more urgent for same deadline
    TASK_URGENCY_MULTIPLIER = {
        TaskType.EXAM.value: 2.0,        # Exams are always urgent
        TaskType.TEST.value: 1.8,         # Tests are very urgent
        TaskType.ASSIGNMENT.value: 1.2,    # Regular assignments
        TaskType.HOMEWORK.value: 1.0,      # Homework
        TaskType.PROJECT.value: 0.8,       # Projects can be planned ahead
        TaskType.LAB_REPORT.value: 1.3,     # Lab reports need preparation
        TaskType.PRESENTATION.value: 1.4,   # Presentations need practice
        TaskType.READING.value: 0.6,        # Reading can be flexible
        TaskType.GROUP_WORK.value: 1.5,     # Group work needs coordination
        TaskType.EXTRA_CREDIT.value: 0.4    # Extra credit is optional
    }

    # Default weight used when a task type does not provide a manual value.
    # This lets the app assign a consistent importance score automatically.
    DEFAULT_TASK_WEIGHTS = {
        TaskType.EXAM.value: 10,
        TaskType.TEST.value: 9,
        TaskType.ASSIGNMENT.value: 6,
        TaskType.HOMEWORK.value: 5,
        TaskType.PROJECT.value: 7,
        TaskType.LAB_REPORT.value: 6,
        TaskType.PRESENTATION.value: 6,
        TaskType.READING.value: 3,
        TaskType.GROUP_WORK.value: 7,
        TaskType.EXTRA_CREDIT.value: 2,
    }
    
    # Define threshold days for each priority level by task type
    # These are base thresholds that get multiplied by the urgency multiplier
    PRIORITY_THRESHOLDS = {
        'high': 2,      # Tasks due in 2 days or less are high priority
        'medium': 5,    # Tasks due in 5 days or less are medium priority
        'low': 10       # Tasks due in more than 10 days are low priority
    }
    
    @classmethod
    def get_default_weight(cls, task_type='assignment'):
        """Return the automatic weight for a given task type."""
        return cls.DEFAULT_TASK_WEIGHTS.get(task_type.lower(), 5)

    @classmethod
    def calculate_priority(cls, deadline, task_type='assignment', weight=None):
        """
        Calculate priority based on deadline, task type, and weight
        
        Args:
            deadline: datetime object
            task_type: string from TaskType enum
            weight: integer from 1-10 (importance). If omitted, a type-based
                default is used automatically.
        
        Returns:
            string: 'high', 'medium', or 'low'
        """
        now = datetime.now()
        
        # Handle past deadlines
        if deadline < now:
            return 'overdue'  # We'll add this as a special status
        
        # Calculate days until deadline
        days_until = (deadline - now).days
        hours_until = (deadline - now).seconds / 3600
        
        # For very close deadlines (less than 24 hours)
        if days_until < 1:
            # If it's due today, check hours
            if hours_until < 6:
                return 'critical'  # Due in less than 6 hours
            return 'high'
        
        # Get urgency multiplier for task type
        urgency_multiplier = cls.TASK_URGENCY_MULTIPLIER.get(
            task_type.lower(), 1.0
        )
        
        if weight is None:
            weight = cls.get_default_weight(task_type)

        # Adjust for weight (weight 1-10, normalized to 0.5-1.5 multiplier)
        weight_multiplier = 0.5 + (weight / 10)
        
        # Calculate effective days (higher multiplier = fewer effective days)
        effective_days = days_until / (urgency_multiplier * weight_multiplier)
        
        # Determine priority based on effective days
        if effective_days <= cls.PRIORITY_THRESHOLDS['high']:
            return 'high'
        elif effective_days <= cls.PRIORITY_THRESHOLDS['medium']:
            return 'medium'
        else:
            return 'low'
    
    @classmethod
    def get_priority_color(cls, priority):
        """Return color code for priority (for UI)"""
        colors = {
            'critical': '#dc3545',  # Red
            'overdue': '#6c757d',    # Gray
            'high': '#ffc107',       # Yellow
            'medium': '#17a2b8',     # Teal
            'low': '#28a745'         # Green
        }
        return colors.get(priority, '#000000')
    
    @classmethod
    def get_priority_emoji(cls, priority):
        """Return a plain text marker for priority (for UI)."""
        markers = {
            'critical': 'CRITICAL',
            'overdue': 'OVERDUE',
            'high': 'HIGH',
            'medium': 'MEDIUM',
            'low': 'LOW'
        }
        return markers.get(priority, 'TASK')
    
    @classmethod
    def get_task_recommendation(cls, task):
        """
        Provide study recommendations based on task type and priority
        """
        recommendations = {
            'exam': "Start reviewing now! Create study guides and practice tests.",
            'test': "Review class notes and complete practice problems.",
            'assignment': "Break down into smaller tasks and start early.",
            'project': "Create a timeline with milestones.",
            'lab_report': "Gather data and start analysis early.",
            'presentation': "Practice your delivery and prepare visual aids.",
            'reading': "Set aside focused reading time with note-taking.",
            'group_work': "Coordinate with team members and set meeting times.",
            'extra_credit': "Optional but can boost your grade!"
        }
        
        base_rec = recommendations.get(task.task_type, "Start working on this task.")
        
        # Add priority-specific advice
        if task.priority == 'critical':
            return f"URGENT: {base_rec} Complete within 6 hours!"
        elif task.priority == 'high':
            return f"High Priority: {base_rec} Focus on this today."
        elif task.priority == 'medium':
            return f"Medium Priority: {base_rec} Plan to work on this this week."
        else:
            return f"Low Priority: {base_rec} Can be scheduled for later."