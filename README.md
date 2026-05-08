# Task Management System

A full-stack web application for creating, tracking, and managing tasks. Built with Python/Flask, containerized with Docker, and deployed on AWS EC2.

---

## How to Run Locally (Docker)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### Steps

**1. Clone or download the project:**
```bash
git clone <repo-url>
cd task_management
```

**2. Build and start the app:**
```bash
docker compose up --build
```

**3. Open in your browser:**
```
http://localhost:80
```

**4. Stop the app:**
```bash
docker compose down
```

> The SQLite database is stored in a Docker volume (`db-data`) and persists across container restarts.

### Running without Docker (Python only)

```bash
pip install -r requirements.txt
python app.py
# Then open http://localhost:5000
```

---

## How to Access the Deployed App

The application is deployed on an AWS EC2 instance (Ubuntu 24.04, t2.micro, region: eu-north-1).

**Live URL:**
```
http://16.171.8.141
```

No port number is required — port 80 (standard HTTP) is mapped directly to the Flask app inside the container.

---

## Features

- Create tasks with title, description, status, and due date
- Edit tasks inline (pre-fills the form)
- Delete tasks with a confirmation dialog
- Filter by status: All / Pending / In Progress / Completed


---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.11 + Flask 3.1 |
| Database | SQLite via SQLAlchemy ORM |
| Frontend | HTML5 + CSS3 + Vanilla JavaScript |
| Container | Docker + Docker Compose |
| Cloud | AWS EC2 (Ubuntu 24.04) |

---

## REST API

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/<id>` | Get one task |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/<id>` | Update a task |
| DELETE | `/api/tasks/<id>` | Delete a task |

### Example — Create a task
```bash
curl -X POST http://localhost:80/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Finish report", "status": "in-progress", "due_date": "2026-05-15"}'
```

### Valid status values: `pending` | `in-progress` | `completed`

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `FLASK_PORT` | `5000` | Port Flask listens on inside the container |
| `FLASK_ENV` | `development` | Set to `production` to disable debug mode |
| `DATABASE_URL` | `sqlite:////app/instance/tasks.db` | SQLAlchemy connection string |

---

## Project Structure

```
task_management/
├── app.py                  # Flask app factory and request logging
├── models.py               # SQLAlchemy Task model
├── routes.py               # REST API endpoints (Blueprint)
├── requirements.txt        # Python dependencies
├── Dockerfile              # Docker image build instructions
├── docker-compose.yml      # Container orchestration
├── .env                    # Environment variables
├── .dockerignore           # Files excluded from Docker build
├── templates/
│   └── index.html          # Single-page HTML frontend
└── static/
    ├── css/style.css        # Stylesheet
    └── js/app.js            # Frontend JavaScript (fetch API)
```
