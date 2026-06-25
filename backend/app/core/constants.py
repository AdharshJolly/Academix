"""
Application Constants
"""

# Task status values
TASK_STATUS_PENDING     = "pending"
TASK_STATUS_IN_PROGRESS = "in_progress"
TASK_STATUS_COMPLETED   = "completed"
TASK_STATUS_CANCELLED   = "cancelled"

# Task priority values
PRIORITY_LOW    = "low"
PRIORITY_MEDIUM = "medium"
PRIORITY_HIGH   = "high"
PRIORITY_URGENT = "urgent"

# Risk level thresholds
RISK_LOW      = "low"       # score < 0.3
RISK_MEDIUM   = "medium"    # score 0.3 – 0.6
RISK_HIGH     = "high"      # score 0.6 – 0.85
RISK_CRITICAL = "critical"  # score > 0.85

# Intelligence input types
INPUT_NOTICE   = "notice"
INPUT_RISK     = "risk"
INPUT_SCHEDULE = "schedule"

# Automation workflow types
WORKFLOW_TASK     = "task"
WORKFLOW_NOTICE   = "notice"
WORKFLOW_SCHEDULE = "schedule"

# Automation statuses
STATUS_PENDING = "pending"
STATUS_SUCCESS = "success"
STATUS_FAILED  = "failed"

