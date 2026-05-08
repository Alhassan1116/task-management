import logging

from flask import Blueprint, jsonify, render_template, request

from models import VALID_STATUSES, Task, db

tasks_bp = Blueprint("tasks", __name__)
logger = logging.getLogger(__name__)


@tasks_bp.route("/")
def index():
    return render_template("index.html")


@tasks_bp.route("/api/tasks", methods=["GET"])
def list_tasks():
    try:
        tasks = Task.query.order_by(Task.created_at.desc()).all()
        return jsonify([t.to_dict() for t in tasks])
    except Exception as exc:
        logger.error("GET /api/tasks failed: %s", exc, exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["GET"])
def get_task(task_id):
    try:
        task = db.session.get(Task, task_id)
        if task is None:
            return jsonify({"error": "Task not found"}), 404
        return jsonify(task.to_dict())
    except Exception as exc:
        logger.error("GET /api/tasks/%s failed: %s", task_id, exc, exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@tasks_bp.route("/api/tasks", methods=["POST"])
def create_task():
    try:
        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        title = (data.get("title") or "").strip()
        if not title:
            return jsonify({"error": "'title' is required and cannot be blank"}), 400

        status = data.get("status", "pending")
        if status not in VALID_STATUSES:
            return jsonify({"error": f"'status' must be one of {sorted(VALID_STATUSES)}"}), 400

        task = Task(
            title=title,
            description=(data.get("description") or "").strip(),
            status=status,
            due_date=data.get("due_date") or None,
        )
        db.session.add(task)
        db.session.commit()
        return jsonify(task.to_dict()), 201
    except Exception as exc:
        db.session.rollback()
        logger.error("POST /api/tasks failed: %s", exc, exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["PUT"])
def update_task(task_id):
    try:
        task = db.session.get(Task, task_id)
        if task is None:
            return jsonify({"error": "Task not found"}), 404

        data = request.get_json(silent=True)
        if not data:
            return jsonify({"error": "Request body must be JSON"}), 400

        if "title" in data:
            title = (data["title"] or "").strip()
            if not title:
                return jsonify({"error": "'title' cannot be blank"}), 400
            task.title = title

        if "description" in data:
            task.description = (data["description"] or "").strip()

        if "status" in data:
            if data["status"] not in VALID_STATUSES:
                return jsonify({"error": f"'status' must be one of {sorted(VALID_STATUSES)}"}), 400
            task.status = data["status"]

        if "due_date" in data:
            task.due_date = data["due_date"] or None

        db.session.commit()
        return jsonify(task.to_dict())
    except Exception as exc:
        db.session.rollback()
        logger.error("PUT /api/tasks/%s failed: %s", task_id, exc, exc_info=True)
        return jsonify({"error": "Internal server error"}), 500


@tasks_bp.route("/api/tasks/<int:task_id>", methods=["DELETE"])
def delete_task(task_id):
    try:
        task = db.session.get(Task, task_id)
        if task is None:
            return jsonify({"error": "Task not found"}), 404
        db.session.delete(task)
        db.session.commit()
        return jsonify({"message": "Task deleted"}), 200
    except Exception as exc:
        db.session.rollback()
        logger.error("DELETE /api/tasks/%s failed: %s", task_id, exc, exc_info=True)
        return jsonify({"error": "Internal server error"}), 500
