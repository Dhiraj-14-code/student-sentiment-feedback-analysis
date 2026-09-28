<<<<<<< HEAD
# Student Sentiment Feedback Analysis System

## Overview
A comprehensive system for collecting student feedback, analyzing sentiment and topics using NLP, and providing an admin dashboard with actionable insights.

## Features
- **Student Portal:** Registration, login, and feedback submission forms.
- **Admin Dashboard:** Overview statistics, sentiment analysis charts, topic distribution, and feedback tracking.
- **NLP Pipeline:** Automatically detects sentiment (Positive, Negative, Neutral) and topics (Teaching, Infrastructure, etc.) from textual feedback using VADER and keyword matching.

## Tech Stack
- **Backend:** Python, FastAPI, SQLAlchemy, SQLite (fallback to match requirements), PyJWT
- **Frontend:** React, Vite, Tailwind CSS, Recharts
- **NLP:** vaderSentiment, scikit-learn
- **Database:** SQLite (defaulted for easy setup without MySQL service dependency, can switch to MySQL via config)

## Architecture
See `docs/architecture.md`

## Setup Instructions

### Backend Setup
1. Open terminal and `cd backend`
2. Create virtual environment: `python -m venv venv`
3. Activate virtual environment:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Run server: `uvicorn app.main:app --reload`
   API will be available at http://localhost:8000/docs

### Frontend Setup
1. Open terminal and `cd frontend`
2. Install dependencies: `npm install`
3. Run development server: `npm run dev`
   App will be available at http://localhost:5173

## Testing
- Ensure the backend is running.
- Register an admin user (e.g., admin@example.com) by checking the "Register as Admin" box.
- Register a student user (e.g., student@example.com).
- Submit feedback as a student and view charts as an admin.

## Limitations
- NLP topic extraction is currently rule-based. Advanced models could improve accuracy.
- Authentication relies on simple JWT logic.
- Built-in SQLite used for immediate run-ability instead of requiring full MySQL setup.
=======
# student-sentiment-feedback-analysis
>>>>>>> b8e1af7b0b4fe0bfdfc6357d4011fde265675f27
