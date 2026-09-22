# Meal Reservation System

A web-based meal reservation application for educational institutions. Students can register, book meals, add guest counts, and provide feedback. Admins manage meals, reservations, attendance, and kitchen meal requirement reports.

## Tech Stack

- **Frontend:** Bootstrap 5, EJS templates
- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose
- **Auth:** Session-based login with bcrypt password hashing

## Features

### Student Module
- Registration and login
- View available meals (filter by session/category)
- Make reservations with date, session, and guest count
- View booking history and reservation status
- Cancel upcoming reservations
- Submit feedback

### Admin Module
- Admin login
- Add, update, delete meals
- Manage meal price and availability
- View and manage student reservations
- Record attendance and no-shows
- View meal requirement reports (date-wise, session-wise)
- View student feedback

### Meal Requirement Module
- Calculate student + guest meal counts
- Session-wise and meal-wise breakdown
- Kitchen preparation planning

### Attendance Module
- Record student attendance per reservation
- Track guest meals attended
- Compare reserved vs attended meals
- No-show tracking

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- MongoDB (local or Atlas)

### Installation

1. **Clone / navigate to project folder**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   copy .env.example .env
   ```
   Edit `.env` with your MongoDB URI and session secret.

4. **Start MongoDB** (if running locally)

5. **Seed sample data**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   npm start
   ```
   Or for development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Open in browser:** http://localhost:3000

## Demo Credentials

| Role    | Email           | Password  |
|---------|-----------------|-----------|
| Admin   | admin@meal.com  | admin123  |
| Student | Register at /register | — |

## Project Structure

```
meal-reservation/
├── config/db.js          # MongoDB connection
├── models/               # Mongoose schemas
├── middleware/auth.js    # Route protection
├── routes/               # Express routes
├── views/                # EJS templates
├── public/               # Static assets
├── server.js             # App entry point
└── seed.js               # Sample data seeder
```

## Main Flow

**Student Reservation + Guest Count → Total Meal Count → Kitchen Preparation → Attendance → Feedback**

## License

MIT


## Email notifications

- Reservation confirmation email is sent after a successful student reservation.
- Reminder email is sent during the final 30 minutes before the reservation booking deadline, only when the student has not already reserved that meal.
- Duplicate reminders are prevented by `MealReminderLog`.
- Configure `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` and `REMINDER_LEAD_MINUTES`.
- For scheduled production reminders, set `CRON_SECRET` in both Vercel and GitHub repository Actions secrets.
- The included GitHub Actions workflow triggers the reminder endpoint every 5 minutes. Vercel Cron is also configured for deployments/plans that support minute-level schedules.
