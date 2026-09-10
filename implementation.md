Build a Full-Stack Web Application: Micro-Volunteer Match

Develop a complete, modern, responsive web application called “Micro-Volunteer Match” using the MERN stack (MongoDB, Express.js, React.js, Node.js).

1. Project Goal

Build a centralized campus volunteering platform that converts large volunteering activities into small 10–15 minute micro-tasks.

The platform should solve the problem of students being unable to commit to long volunteer shifts because of classes and exams, while campus clubs and departments have many small tasks that remain unfinished.

Examples:

- Designing an Instagram poster
- Sorting donated books
- Moving boxes
- Translation
- 15-minute tutoring
- Other small campus-support tasks

The main idea is:

Post Task → Find Task → Claim Task → Complete Task → Earn Impact Minutes

2. User Roles

Create two types of users:

Student / Volunteer

Students can:

- Register and log in
- Create a profile
- Select their skills
- Browse available micro-tasks
- Filter tasks by category, duration, location, and skills
- View task details
- Claim a task instantly
- View their claimed tasks
- Mark tasks as completed
- Track completed tasks and volunteer minutes
- View their personal impact statistics

Organizer / Club

Organizers can:

- Register and log in
- Create campus organization profiles
- Post micro-tasks
- Add task title, description, category, estimated minutes, location, and required skills
- View posted tasks
- Track task status
- See which student claimed a task
- Monitor completed tasks

3. Main Task Categories

Include these categories:

- Design
- Tutoring
- Logistics
- Translation

Allow the system to support additional categories in the future.

4. Task Lifecycle

Every task must have exactly these main states:

OPEN → IN-PROGRESS → COMPLETED

Open

Task is available for students to claim.

In-Progress

A student has claimed the task.

Completed

The volunteer has completed the task.

Once completed:

- Increase the student's completed-task count
- Add the task's estimated minutes to the student's impact minutes
- Increase the campus-wide total impact minutes
- Update the task status

5. Core Pages

Create the following pages:

Landing Page

Include:

- Micro-Volunteer Match logo/name
- Short tagline: “Turning spare minutes into campus impact”
- Explanation of the platform
- How it works
- Statistics
- Login/Register buttons

Student Dashboard

Display:

- Total tasks completed
- Total volunteer minutes
- Available tasks
- Current active task
- Recent completed tasks
- Personal impact statistics

Micro-Task Board

Create a card-based task marketplace.

Each task card should display:

- Task title
- Category
- Estimated time
- Location / Remote
- Posted by
- Required skill
- Status
- Claim button

Add filters:

- Category
- Duration: 10–15 minutes
- Skill
- Location
- Status

Task Details Page

Show:

- Title
- Description
- Category
- Required skill
- Estimated minutes
- Location
- Organizer
- Posted date
- Current status

Provide an “Accept Task” button.

Organizer Dashboard

Show:

- Posted tasks
- Open tasks
- In-progress tasks
- Completed tasks
- Total volunteer minutes generated

Post Task Page

Create a simple form containing:

- Task title
- Task description
- Category
- Required skill
- Estimated duration
- Location
- Remote/On-campus option

Only allow realistic micro-task durations such as 10–15 minutes.

Profile Page

Display:

- Student name
- Skills
- Tasks completed
- Total impact minutes
- Impact score/badge

6. Campus Impact Counter

Create a prominent live counter on the dashboard:

Campus Impact: 140 Minutes Contributed

The number should automatically update whenever a task is completed.

Also display:

- Total tasks completed
- Total active volunteers
- Total campus impact minutes

Use attractive animated counters where appropriate.

7. Database Design

Use MongoDB.

Create collections/models such as:

User

Fields:

- name
- email
- password
- role
- skills
- completedTasks
- impactMinutes
- createdAt

Task

Fields:

- title
- description
- category
- requiredSkill
- estimatedMinutes
- location
- isRemote
- organizer
- volunteer
- status
- createdAt
- completedAt

Organization

Fields:

- name
- description
- organizer
- createdAt

Use MongoDB relationships/references appropriately.

8. Backend API

Create a REST API using Express.js.

Implement endpoints for:

Authentication

- Register
- Login
- Get current user

Tasks

- Create task
- Get all open tasks
- Get task by ID
- Filter/search tasks
- Claim task
- Mark task as completed
- Get user's tasks
- Get organizer's tasks

Statistics

- Get individual volunteer statistics
- Get campus-wide statistics

Implement proper authentication and authorization using JWT.

9. Frontend

Use React.js.

Create reusable components:

- Navbar
- Sidebar
- TaskCard
- FilterBar
- ImpactCounter
- StatisticsCard
- StatusBadge
- TaskForm
- ProfileCard
- DashboardCard
- LoadingSpinner
- ErrorMessage
- ConfirmationModal

Use React Router for navigation.

Use Axios or Fetch API for backend communication.

10. UI/UX Requirements

Design the application as a modern college/campus volunteering platform.

Use:

- Clean dashboard
- Responsive layout
- Cards
- Rounded components
- Clear status indicators
- Attractive icons
- Mobile-friendly design
- Empty states
- Loading states
- Error handling

The interface should make it possible for a student to find and claim a task within a few seconds.

Example task cards:

Need 1 Instagram Poster for Tech Fest

- Design
- 15 mins
- Remote
- Posted by Coding Club
- OPEN
- [Accept Task]

Move 3 Boxes of Books to Library

- Logistics
- 10 mins
- Ground Floor, Block B
- IN PROGRESS

11. Solution Flow

Implement this exact workflow:

Organizer/Club
↓
Post 10–15 minute task
↓
Task stored in MongoDB
↓
Status = OPEN
↓
Student
↓
Filter tasks by skill/category/time
↓
View task
↓
Click “Accept Task”
↓
Status = IN-PROGRESS
↓
Student completes task
↓
Click “Mark Complete”
↓
Status = COMPLETED
↓
Update student impact
↓
Increase campus impact counter

12. Security

Implement:

- JWT authentication
- Password hashing using bcrypt
- Protected routes
- Role-based authorization
- Input validation
- Prevent multiple students from claiming the same task
- Prevent unauthorized users from completing tasks they did not claim

13. Important Business Rules

1. Only OPEN tasks can be claimed.
2. A task can have only one volunteer.
3. Only the assigned volunteer can mark the task completed.
4. Completed tasks cannot be claimed again.
5. Only organizers can create tasks.
6. Task duration should be between 10 and 15 minutes.
7. Campus impact minutes should increase only once when a task becomes COMPLETED.
8. Students should be able to filter tasks according to their skills.

14. Project Structure

Use a clean structure:

frontend/

- src/
  - components/
  - pages/
  - layouts/
  - services/
  - hooks/
  - context/
  - utils/

backend/

- models/
- controllers/
- routes/
- middleware/
- config/
- services/
- server.js

Create a ".env" file for:

- MongoDB connection string
- JWT secret
- Backend port

15. Final Requirements

Build the application as a fully functional project, not just a UI prototype.

The frontend and backend must communicate correctly.

Include:

- Authentication
- MongoDB database
- REST APIs
- Task creation
- Task filtering
- Instant claiming
- Task status tracking
- Completion tracking
- Volunteer impact statistics
- Campus-wide impact counter
- Responsive UI
- Proper error handling

Also provide:

1. Complete source code
2. MongoDB schema/models
3. API documentation
4. Setup instructions
5. ".env.example"
6. Sample/demo data
7. Instructions to run frontend and backend
8. Clear comments for important sections

Prioritize a polished MVP that can be demonstrated during a college hackathon presentation.

## Implemented Skill and Service Expansion

The MVP now supports the requested service-specific volunteer flow:

- Reusable category/service catalog for Design, Video Editing, Programming, Writing, Photography, Tutoring, Translation, and Logistics.
- Student profiles store `{ name, services }` skill groups, interests, availability, and optional portfolio links.
- Organizer task creation requires a category and dynamically selected service, with 10-15 minute duration validation, difficulty, and preferred date/time.
- Task discovery supports search and filters for category, service, location, difficulty, duration, status, and remote work.
- Matching awards service, parent-skill, interest, and availability points up to 100 and powers the Recommended For You dashboard section.
- Profiles show What Can I Help With, editable services, portfolio links, impact counters, category breakdowns, and achievement badges.
- Task templates prefill common Design, Video Editing, Programming, and Tutoring tasks.
- Completion updates completed tasks, volunteer minutes, people helped, campus impact, and badges exactly once through the existing lifecycle rules.

### Added API behavior

- `GET /api/tasks/catalog`
- `GET /api/tasks/recommendations`
- `PATCH /api/stats/profile`
- `GET /api/stats/me` now returns category impact and badge progress.
- `GET /api/tasks` accepts `service`, `difficulty`, `minMinutes`, `maxMinutes`, and `search` filters.

### Verification

- Backend modules pass Node syntax checks.
- Frontend production build passes with Vite.

## Impact Expansion (trust + coordination)

Solves no-shows, quality control, organizer effort, and motivation:

- **Proof + approval:** `requiresApproval` tasks go `IN-PROGRESS -> PENDING_REVIEW -> COMPLETED`. Volunteer `PATCH /tasks/:id/submit {proofUrl, proofNote}`, organizer `PATCH /:id/approve` (awards impact once via `impactCounted`) or `PATCH /:id/reject`. Legacy `PATCH /:id/complete` still works for no-approval tasks.
- **Team slots:** `slotsTotal 1-5`, `volunteers[]`. Claim fills slots, card shows `Team 1/3 · 2 left`. Student `GET /tasks/mine` matches `volunteer` or `volunteers`.
- **Applicant queue:** `POST /tasks/:id/request` joins `applicants[]`, organizer `POST /:id/pick {userId}` moves to volunteers. Visible on Task Detail.
- **Ratings:** `POST /tasks/:id/rate {score 1-5}` stores `volunteerRating` / `organizerRating`, updates `User.ratingAvg/ratingCount`. Shown on cards, profiles, leaderboard. New badges: Team Player, Trusted Star.
- **Urgent SOS + beginner:** `urgency: Normal/Urgent`, `deadline`, `beginnerFriendly`. Urgent ranks first everywhere, red SOS badge. Board filters `urgency`, `beginnerFriendly`.
- **Comments/Q&A:** `POST /tasks/:id/comments {text}` with populated names. Replaces WhatsApp chaos for files/venue/time.
- **Clone:** `POST /tasks/:id/clone` duplicates organizer's task as fresh OPEN.
- **Alerts:** `GET/POST /stats/alerts`, `DELETE /stats/alerts/:idx` (`{category, service, minMatch}`). Board "Alert me" saves current filters; recommendations boost +5 for alert matches.
- **Gaps + leaderboard + certificate:** `GET /stats/gaps` (open vs volunteers per category), `GET /stats/leaderboard` (top 10 by minutes), `GET /stats/certificate` (name, tasks, minutes, top skills, date). Dashboard shows demand-supply bars + leaderboard + share/print certificate. Calendar `.ics` download generated client-side from `preferredTime/deadline`.
- **Task model:** adds `urgency, deadline, beginnerFriendly, slotsTotal, volunteers[], applicants[], proofUrl/proofNote/submittedAt, requiresApproval, impactCounted, volunteerRating/organizerRating + reviews, comments[]`, status now includes `PENDING_REVIEW` (old OPEN/IN-PROGRESS/COMPLETED flows unchanged).
- **User model:** adds `alerts[], ratingAvg, ratingCount, noShowCount`.
- **Seed:** urgent poster, team photo (3 slots), team books (2 slots), approval-required video, beginner flags, demo ratings + alert.

### New API behavior

- `PATCH /api/tasks/:id/submit`, `PATCH /api/tasks/:id/approve`, `PATCH /api/tasks/:id/reject`
- `POST /api/tasks/:id/request`, `POST /api/tasks/:id/pick`, `POST /api/tasks/:id/clone`
- `POST /api/tasks/:id/rate`, `POST /api/tasks/:id/comments`
- `GET /api/stats/gaps`, `GET /api/stats/leaderboard`, `GET /api/stats/certificate`
- `GET/POST /api/stats/alerts`, `DELETE /api/stats/alerts/:idx`
- `GET /api/tasks` accepts `urgency`, `beginnerFriendly`
- `GET /api/stats/campus` now returns `urgentOpen`

### Verification

- Backend `node --check` passes for Task, User, taskRoutesV2, statRoutesV2, seed.
- Frontend `npm run build` passes with Vite.
