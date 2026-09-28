from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth, feedback, analytics, issues
from .models import models

Base.metadata.create_all(bind=engine)

app = FastAPI(title="EduPulse AI - Student Experience Intelligence System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(feedback.router)
app.include_router(analytics.router)
app.include_router(issues.router)

@app.get("/")
def read_root():
    return {"message": "EduPulse AI - Evidence-Based Student Experience Intelligence System", "docs": "/docs"}
