from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import models
from ..schemas import schemas
from .dependencies import get_current_admin_user
from datetime import datetime

router = APIRouter(prefix="/api/issues", tags=["issues"])

@router.get("", response_model=List[schemas.Issue])
def get_all_issues(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    return db.query(models.Issue).order_by(
        models.Issue.priority.desc(),
        models.Issue.related_feedback_count.desc()
    ).all()

@router.get("/{id}", response_model=schemas.Issue)
def get_issue(id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    issue = db.query(models.Issue).filter(models.Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue

@router.get("/{id}/feedbacks")
def get_issue_feedbacks(id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    issue = db.query(models.Issue).filter(models.Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Return feedback samples from this aspect
    feedbacks = db.query(models.Feedback).filter(models.Feedback.topic == issue.aspect).limit(10).all()
    
    # Detect contradictions
    pos_samples = [f for f in feedbacks if f.sentiment_label == "Positive"][:2]
    neg_samples = [f for f in feedbacks if f.sentiment_label == "Negative"][:2]
    has_contradiction = len(pos_samples) > 0 and len(neg_samples) > 0
    
    return {
        "samples": [{"id": f.id, "text": f.text, "sentiment": f.sentiment_label, "rating": f.rating, "department": f.department, "semester": f.semester} for f in feedbacks],
        "has_contradiction": has_contradiction,
        "positive_samples": [{"text": f.text} for f in pos_samples],
        "negative_samples": [{"text": f.text} for f in neg_samples],
    }

@router.patch("/{id}/status")
def update_issue_status(
    id: int,
    update: schemas.IssueStatusUpdate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    issue = db.query(models.Issue).filter(models.Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    valid_statuses = ["Detected", "Under Review", "Action Planned", "Action Implemented", "Monitoring", "Resolved"]
    if update.status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    issue.status = update.status
    if update.admin_notes:
        issue.admin_notes = update.admin_notes
    issue.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Status updated", "status": issue.status}

@router.post("/{id}/intervention")
def record_intervention(
    id: int,
    data: schemas.InterventionCreate,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    issue = db.query(models.Issue).filter(models.Issue.id == id).first()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    # Snapshot current metrics as "before"
    intervention = models.Intervention(
        issue_id=id,
        action_taken=data.action_taken,
        action_date=data.action_date or datetime.utcnow(),
        notes=data.notes,
        before_neg_pct=issue.neg_pct,
        before_avg_rating=issue.avg_rating,
        before_feedback_count=issue.current_count,
    )
    db.add(intervention)
    issue.status = "Action Implemented"
    issue.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(intervention)
    return {"message": "Intervention recorded", "id": intervention.id}
