# Habit Tracker API

A modern backend API for tracking habits, streaks, reminders, analytics, and progress visualization.

Built with Node.js, Express, TypeScript, PostgreSQL, and Drizzle ORM.

---

# Features

* User authentication with JWT
* Create and manage habits
* Track daily habit entries
* Habit streak system
* Tags and habit categorization
* Reminder system
* Heatmap analytics data
* Relational database design
* Input validation using Zod
* PostgreSQL + Drizzle ORM
* Type-safe backend architecture

---

# Tech Stack

* Node.js
* Express.js
* TypeScript
* PostgreSQL
* Drizzle ORM
* Zod
* JWT Authentication
* bcrypt
* Neon PostgreSQL

---

# Project Structure

```txt
src/
│
├── controllers/
├── routes/
├── middleware/
├── db/
│   ├── schema.ts
│   ├── connections.ts
│   └── seed.ts
│
├── utils/
├── index.ts
└── app.ts
```

---

# Database Design

Main entities:

* Users
* Habits
* Entries
* Tags
* HabitTags
* HabitDailyStats
* HabitReminders

The project uses relational modeling with:

* One-to-many relationships
* Many-to-many relationships
* Composite unique constraints
* Indexed queries for performance

---

# API Endpoints

## Authentication

```http
POST /api/auth/register
POST /api/auth/login
```

---

## Habits

```http
GET    /api/habits
POST   /api/habits
PATCH  /api/habits/:id
DELETE /api/habits/:id
```

---

## Entries

```http
POST /api/habits/:habitId/entries
```

---

## Tags

```http
GET    /api/tags
POST   /api/tags
PATCH  /api/tags/:id
DELETE /api/tags/:id
```

---

## Reminders

```http
GET    /api/habits/:habitId/reminders
POST   /api/habits/:habitId/reminders

PATCH  /api/reminders/:id
DELETE /api/reminders/:id

PATCH  /api/reminders/:id/toggle
```

---

## Analytics

```http
GET /api/habits/:habitId/heatmap
GET /api/habits/:habitId/stats
```

---

# Getting Started

## 1. Clone the repository

```bash
git clone <your-repository-url>
cd habit-tracker-api
```

---

## 2. Install dependencies

```bash
npm install
```

---

## 3. Configure environment variables

Create a `.env` file:

```env
DATABASE_URL=your_database_url
JWT_SECRET=your_secret
PORT=3000
```

---

## 4. Push database schema

```bash
npm run db:push
```

---

## 5. Seed the database

```bash
npm run db:seed
```

---

## 6. Start development server

```bash
npm run dev
```

---

# Available Scripts

```bash
npm run dev
npm run start

npm run db:generate
npm run db:push
npm run db:migrate
npm run db:studio
npm run db:seed

npm run test
npm run test:watch
npm run test:coverage
```

---

# Example Heatmap Response

```json
{
  "habitId": "479c8c70-e082-4eab-b662-d9a5c1403a59",
  "data": [
    {
      "date": "2026-05-18",
      "count": 1
    }
  ]
}
```

---

# Future Improvements

* Smarter streak recalculation
* Scheduled notifications
* Background jobs / cron tasks
* Weekly & monthly analytics
* Social features
* Mobile frontend integration
* Real-time notifications
* AI habit recommendations

---

# Learning Goals

This project was built to deepen understanding of:

* Backend architecture
* REST API design
* Relational database modeling
* Authentication systems
* Transactions
* Query optimization
* Type-safe backend development
* Analytics system design

---

# License

MIT
