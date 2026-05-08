import logging
import os
import time

from flask import Flask, g, request

from models import db


def create_app():
    app = Flask(__name__)

    database_url = os.getenv("DATABASE_URL", "sqlite:///tasks.db")

    # For absolute SQLite paths (e.g. sqlite:////app/instance/tasks.db in Docker)
    # ensure the directory exists before SQLAlchemy tries to create the file.
    if database_url.startswith("sqlite:////"):
        db_path = database_url[len("sqlite:///"):]
        os.makedirs(os.path.dirname(db_path), exist_ok=True)

    app.config["SQLALCHEMY_DATABASE_URI"] = database_url
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    db.init_app(app)

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s %(levelname)s %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    logger = logging.getLogger(__name__)

    @app.before_request
    def _start_timer():
        g.start = time.time()

    @app.after_request
    def _log_request(response):
        duration_ms = round((time.time() - g.start) * 1000)
        logger.info(
            "%s %s %s %dms",
            request.method,
            request.path,
            response.status_code,
            duration_ms,
        )
        return response

    from routes import tasks_bp
    app.register_blueprint(tasks_bp)

    with app.app_context():
        db.create_all()

    return app


if __name__ == "__main__":
    port = int(os.getenv("FLASK_PORT", 5000))
    flask_env = os.getenv("FLASK_ENV", "production")
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=(flask_env == "development"))
