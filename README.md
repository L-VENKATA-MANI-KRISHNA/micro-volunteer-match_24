# Micro-Volunteer Match

A MERN campus platform for matching students with useful 10–15 minute volunteer tasks

## Run locally

1. Ensure MongoDB is running locally (or use an Atlas URI).
2. Copy `backend/.env.example` to `backend/.env`, set `MONGODB_URI` and a strong `JWT_SECRET`.
3. Copy `frontend/.env.example` to `frontend/.env` if the API is not at `http://localhost:5001/api`.
4. Run `npm install`, then `npm run install:all`.
5. Load demo content with `npm run seed`.
6. Start both services with `npm run dev`. The client is served by Vite (usually `http://localhost:5173`).

Demo accounts: `student@micromatch.demo` / `demo123`, and `organizer@micromatch.demo` / `demo123`.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | `/api/auth/register` | Create a student or organizer account |
| POST | `/api/auth/login` | Log in and receive a JWT |
| GET | `/api/auth/me` | Current authenticated user |
| GET / POST | `/api/tasks` | Browse filtered tasks / create organizer task |
| GET | `/api/tasks/mine` | Current user's assigned or posted tasks |
| GET | `/api/tasks/:id` | Task detail |
| PATCH | `/api/tasks/:id/claim` | Student claims a task (atomic for 1-slot, team-aware) |
| PATCH | `/api/tasks/:id/submit` | Volunteer submits proof link/note |
| PATCH | `/api/tasks/:id/approve` | Organizer approves proof → COMPLETED + impact |
| PATCH | `/api/tasks/:id/reject` | Organizer sends proof back for rework |
| PATCH | `/api/tasks/:id/complete` | Assigned student completes task (no-approval path) |
| POST | `/api/tasks/:id/request` | Student requests to join (applicant queue) |
| POST | `/api/tasks/:id/pick` | Organizer picks an applicant |
| POST | `/api/tasks/:id/clone` | Organizer duplicates own task |
| POST | `/api/tasks/:id/rate` | Rate collaboration 1–5 after completion |
| POST | `/api/tasks/:id/comments` | Q&A / coordination thread |
| GET | `/api/tasks/catalog` | Reusable category/service catalog |
| GET | `/api/tasks/recommendations` | Top service-based matches for student |
| GET | `/api/stats/campus` | Campus total impact, task count, volunteers |
| GET | `/api/stats/me` | Impact stats, category breakdown, badges |
| GET | `/api/stats/gaps` | Open-tasks vs volunteers per category |
| GET | `/api/stats/leaderboard` | Top volunteers by minutes |
| GET | `/api/stats/certificate` | Shareable certificate data |
| GET/POST | `/api/stats/alerts` | Saved high-match alerts |
| PATCH | `/api/stats/profile` | Update skills, interests, availability, portfolio |

The server validates 10–15 minute durations, uses bcrypt password hashes and JWT authentication, and enforces task lifecycle and role permissions.
