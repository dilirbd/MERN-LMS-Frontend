# DDR LMS

DDR LMS is a simple, full-stack Learning Management System (LMS) that allows students to discover and enroll in courses, watch or go through lessons, and track their learning progress. Instructors can make and manage courses, organize them into modules and lessons, and publish them for students.

The project was built with an emphasis on practical full-stack development, authentication, role-based access and course management.

## Features

### Student

* Register and log in
* Email verification
* Browse published courses
* Search, sort, and paginate courses
* Enroll in courses
* View enrolled courses
* Watch course lessons
* Mark lessons as completed
* Track course progress
* Unenroll from courses
* Update profile information

### Instructor

* Register and log in
* Make courses
* Edit course information
* Add and manage modules
* Add and manage lessons
* Add video links to lessons
* Publish courses
* Delete courses

### Authentication & Authorization

* Session-based authentication using HTTP-only cookies
* Email verification
* Role-based access for students and instructors
* Protected API routes

## Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* Node.js
* Express
* TypeScript
* Mongoose

### Database

* MongoDB and MongoDB Atlas

### Deployment

* Netlify — Frontend
* Render — Backend
* MongoDB Atlas — Database

## Application Structure

The core learning structure is:

```text
Course
  └── Module
       └── Lesson
            └── Video
```

Students enroll in courses and their progress is tracked at the lesson level.

## How It Works

### Students

A student can browse the available courses and open a course to view its description and content. After enrolling, the course becomes available in **My Courses**, where the student can open the learning interface, select lessons, watch videos, and mark lessons as complete.

The course progress is automatically calculated based on completed lessons.

### Instructors

Instructors can make new courses as drafts and gradually build their course content by adding modules and lessons.

A course can only be published after it has at least one lesson in each of it's modules. Once published, it becomes available to students and cannot be unpublished (for now).

## Main Areas

The application includes:

* Course browsing
* Course details
* Student dashboard
* Instructor dashboard
* Course construction
* Course management
* Learning interface
* Profile management
* Authentication pages

## Running Locally

Clone the repository and install dependencies:

```bash
npm install
```

Make a `.env.local` file at the project root and put the backend URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

Start the development server:

```bash
npm run dev
```

The frontend will run at:

```text
http://localhost:3000
```

The backend must also be running for authentication and API functionality.

## Project Goals

The main goal of this project was to build a minimal LMS while keeping the scope focused on the essential learning workflow.

The project demonstrates:

* Full-stack application development
* REST API integration
* Session-based authentication
* Role-based authorization
* CRUD operations
* MongoDB data relationships
* Course and content management
* Progress tracking
* Responsive frontend development (still in-progress)
* Production deployment

## Scope

DDR LMS intentionally focuses on the core, essential LMS experience.

Features such as payments, quizzes, assignments, certificates, notifications, and advanced analytics are currently outside the scope of this project.

## Deployment

The production application uses:

```text
Frontend → Netlify
Backend  → Render
Database → MongoDB Atlas
```

The frontend communicates with the deployed backend through the configured `NEXT_PUBLIC_API_URL` environment variable.

---


