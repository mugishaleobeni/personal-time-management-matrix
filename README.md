# personal-time-management-matrix

> **Chronos OS** — Production-grade Personal Productivity, Time Management & Knowledge Matrix System.

---

## ⚡ Overview
Chronos is a unified, high-performance personal productivity platform engineered with:
- **Dynamic Daily Schedule Matrix**: Automatically synchronized with real calendar weeks, day selection, live chronological "NOW" indicators, and habit tracking.
- **Task & Subtask Management**: Full checklist milestones, priority queues, duration tracking, and progress visualization.
- **Daily Rituals & Habit Streaks**: Streak counters, morning/afternoon/evening routine categorization.
- **Notebook & Knowledge Matrix**: Persistent notes with real-time cloud sync, markdown rendering, and dedicated Read / Edit modes.
- **Focus Timer & Pomodoro Engine**: Stage transitions, cycles counter, and automatic time accumulation synced to tasks.
- **Enterprise Security & Auth**: Full authentication (register with names/email/password, login, and forgot password recovery codes via Gmail SMTP).
- **MongoDB Atlas Integration**: Live persistent cloud database.
- **Production Server**: Single-port serving of production Vite SPA and FastAPI backend with Gunicorn and Uvicorn workers.

---

## 🚀 Deployment on Render

### Web Service Specification
- **Environment**: `Python`
- **Build Command**:
  ```bash
  pip install -r backend/requirements.txt && npm install && npm run build
  ```
- **Start Command**:
  ```bash
  gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:$PORT --chdir backend
  ```

### Required Environment Variables on Render
| Variable | Value / Description |
|---|---|
| `ENVIRONMENT` | `production` |
| `DATABASE_NAME` | `chronos_db` |
| `MONGODB_URI` | `mongodb+srv://<username>:<password>@engineerdog.py31vdo.mongodb.net/?retryWrites=true&w=majority` |
| `JWT_SECRET_KEY` | *(A secure 32+ character random string)* |
| `GMAIL_APP_PASSWORD` | *(16-character Google App Password)* |
| `SMTP_USER` | *(Your Gmail address, e.g. `mugishaleobeni0@gmail.com`)* |
| `SMTP_FROM_EMAIL` | *(Your Gmail address)* |
| `SMTP_FROM_NAME` | `Chronos OS` |

---

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   cd backend && python -m venv venv && ./venv/bin/pip install -r requirements.txt && cd ..
   ```

2. **Configure Environment**:
   Copy `backend/.env.example` to `backend/.env` and update credentials.

3. **Start Unified Development Server**:
   ```bash
   npm run dev:all
   ```
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:8000/docs`

4. **Run Test Suite**:
   ```bash
   npm test
   ```

---

## 🛡️ License
ISC License • Engineered with ❤️ for high-velocity productivity.
