# Task Management System — Project Report

---

## 1. Project Idea and Objectives

### Project Idea

The Task Management System is a full-stack web application that allows users to create, view, update, and delete tasks through a clean browser-based interface. The project demonstrates how a modern web application is built end-to-end: from a REST API backend, to a responsive frontend, to containerization with Docker, to live deployment on AWS.

### Objectives

- Build a functional REST API backend using Python and Flask
- Persist data in a SQLite database using SQLAlchemy ORM
- Serve a responsive single-page frontend using HTML, CSS, and vanilla JavaScript
- Package the application into a portable Docker container
- Deploy the containerized application to AWS EC2, accessible from anywhere on the internet

### Core Features

| Feature | Description |
|---|---|
| Create tasks | Add a task with title, description, status, and due date |
| Read tasks | View all tasks, or retrieve a single task by ID |
| Update tasks | Edit any field of an existing task |
| Delete tasks | Remove a task with a confirmation dialog |
| Filter by status | Show All / Pending / In Progress / Completed tasks |
| Status badges | Color-coded badges to visually distinguish task states |
| Data persistence | SQLite database stored in a Docker volume — survives restarts |
| Request logging | Every HTTP request is logged with method, path, status, and duration |

---

## 2. AWS Services Used

### Amazon EC2 (Elastic Compute Cloud)

EC2 is AWS's virtual machine service. It provides on-demand cloud servers that can run any software.

**Instance configuration:**

| Setting | Value |
|---|---|
| Instance type | t2.micro (1 vCPU, 1 GB RAM) — AWS Free Tier eligible |
| Operating system | Ubuntu 24.04 LTS |
| Region | eu-north-1 (Stockholm) |
| Public IPv4 address | 16.171.8.141 |

**Security Group (EC2 firewall rules):**

| Port | Protocol | Purpose |
|---|---|---|
| 22 | TCP | SSH — remote terminal access |
| 80 | TCP | HTTP — web traffic to the app |
| All other ports | — | Closed by default |

**Key Pair:**
- Type: RSA (`.pem` file)
- Used for SSH authentication — no password required
- AWS stores the public key; the private key is kept locally

**No other AWS services were used.**
The database (SQLite) runs inside the container on the same EC2 instance. In a production system, SQLite would be replaced with **Amazon RDS** (managed relational database) and static files would be stored on **Amazon S3**.

---

## 3. Deployment Steps

### Step 1 — Launch EC2 Instance

1. Log into AWS Console → EC2 → **Launch Instance**
2. Select **Ubuntu 24.04 LTS** as the AMI
3. Choose **t2.micro** (free tier)
4. Create a new RSA key pair → download the `.pem` file
5. In Security Group settings, add inbound rules for **port 22 (SSH)** and **port 80 (HTTP)**
6. Click **Launch Instance**

---

### Step 2 — Fix SSH Key Permissions (Windows)

SSH refuses key files that are readable by other users. Run these commands in PowerShell to restrict access to the `.pem` file:

```powershell
icacls "task-manager-key.pem" /inheritance:r
icacls "task-manager-key.pem" /remove "BUILTIN\Administrators"
icacls "task-manager-key.pem" /grant:r "$($env:USERNAME):(R)"
```

---

### Step 3 — Connect to the Server via SSH

```bash
ssh -i "task-manager-key.pem" ubuntu@16.171.8.141
```

This opens an encrypted terminal session on the remote EC2 server.

---

### Step 4 — Install Docker on the EC2 Server

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
sudo apt install docker-compose-plugin -y
exit   # log out and back in for group membership to take effect
```

Re-connect via SSH after logging out:
```bash
ssh -i "task-manager-key.pem" ubuntu@16.171.8.141
```

---

### Step 5 — Upload Project Files to EC2

From a local Windows PowerShell terminal (not on the server):

```powershell
scp -i "task-manager-key.pem" -r "C:\Users\ragna\Desktop\task_management" ubuntu@16.171.8.141:~/task_management
```

`scp` transfers files securely over SSH. The `-r` flag copies the entire directory recursively.

---

### Step 6 — Build and Start the Application

On the EC2 server:

```bash
cd ~/task_management
docker compose up --build -d
```

- `--build` — rebuilds the Docker image from the Dockerfile
- `-d` — detached mode, runs in the background

---

### Step 7 — Verify the Deployment

```bash
docker compose ps      # confirm the container is running
docker compose logs    # view application output
```

---

### Result

The application is live and accessible at:

```
http://16.171.8.141
```

---

### Useful EC2 Management Commands

| Command | Description |
|---|---|
| `docker compose ps` | Show running containers |
| `docker compose logs -f` | Follow live application logs |
| `docker compose down` | Stop the application |
| `docker compose up -d` | Start the application in background |
| `docker compose up --build -d` | Rebuild image and restart |

---

## Technology Stack Summary

| Layer | Technology | Version |
|---|---|---|
| Backend language | Python | 3.11 |
| Web framework | Flask | 3.1.0 |
| ORM | SQLAlchemy | 2.0.36 |
| Database | SQLite | — |
| Frontend | HTML5 + CSS3 + JavaScript | — |
| WSGI server | Gunicorn | 23.0.0 |
| Containerization | Docker + Docker Compose | 3.9 format |
| Cloud hosting | AWS EC2 | Ubuntu 24.04 |

---

## Architecture Overview

```
Browser
  │  HTTP (port 80)
  ▼
AWS EC2 Instance (16.171.8.141)
  │  Docker port mapping: 80 → 5000
  ▼
Docker Container
  ├── Flask REST API (port 5000)
  ├── SQLite Database (Docker volume: db-data)
  └── Static Frontend (HTML + CSS + JS)
```

The frontend is a single-page application served by Flask. JavaScript makes asynchronous `fetch()` calls to the REST API. All data is stored in a SQLite file mounted in a persistent Docker volume.
