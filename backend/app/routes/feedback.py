from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models import models
from ..schemas import schemas
from ..nlp.analyzer import process_feedback
from .dependencies import get_current_user, get_current_admin_user
from ..services.intelligence import (
    group_similar_feedback, calc_evidence_strength,
    calc_priority, generate_recommendation, get_contributing_factors
)
from datetime import datetime

router = APIRouter(prefix="/api/feedback", tags=["feedback"])

@router.post("", response_model=schemas.Feedback)
def create_feedback(
    feedback: schemas.FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Construct a comprehensive text for NLP combining chips and text
    parts = []
    if feedback.worked_well:
        parts.append("Positive aspects: " + ", ".join(feedback.worked_well) + ".")
    if feedback.needs_improvement:
        parts.append("Areas for improvement: " + ", ".join(feedback.needs_improvement) + ".")
    if feedback.text:
        parts.append(feedback.text)
        
    combined_text = " ".join(parts)
    if not combined_text.strip():
        combined_text = "Neutral feedback"
        
    label, score, topic, aspects, quality = process_feedback(combined_text)
    
    new_feedback = models.Feedback(
        **feedback.model_dump(),
        user_id=current_user.id,
        sentiment_label=label,
        sentiment_score=score,
        topic=topic,
        aspects=aspects,
        feedback_quality=quality
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    # Trigger issue re-computation in background (lightweight)
    _recompute_issues(db)
    
    return new_feedback

@router.get("", response_model=List[schemas.Feedback])
def get_all_feedback(
    skip: int = 0, limit: int = 100,
    db: Session = Depends(get_db),
    current_admin: models.User = Depends(get_current_admin_user)
):
    return db.query(models.Feedback).offset(skip).limit(limit).all()

@router.get("/{id}", response_model=schemas.Feedback)
def get_feedback(id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    feedback = db.query(models.Feedback).filter(models.Feedback.id == id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    return feedback

@router.delete("/{id}")
def delete_feedback(id: int, db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    feedback = db.query(models.Feedback).filter(models.Feedback.id == id).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="Feedback not found")
    db.delete(feedback)
    db.commit()
    return {"message": "Feedback deleted"}


def _recompute_issues(db: Session):
    """Recompute issues from feedback groups. Called after each submission."""
    all_feedbacks = db.query(models.Feedback).all()
    if len(all_feedbacks) < 2:
        return
    
    groups = group_similar_feedback(all_feedbacks)
    
    for group in groups:
        aspect = group["aspect"]
        count = group["count"]
        neg_pct = group["neg_pct"]
        avg_rating = group["avg_rating"]
        dominant = group["dominant_sentiment"]
        name = f"{aspect} Issue"
        
        # Find or create issue
        issue = db.query(models.Issue).filter(models.Issue.aspect == aspect).first()
        
        # Evidence and priority
        affected_sems = len(set(f.semester for f in group["feedbacks"]))
        persistence = issue.persistence_periods if issue else 1
        if issue and issue.current_count < count:
            persistence = issue.persistence_periods + 1
        
        evidence = calc_evidence_strength(count, neg_pct, persistence, affected_sems)
        
        prev_count = issue.current_count if issue else 0
        pct_change = 0
        if prev_count > 0:
            pct_change = round((count - prev_count) / prev_count * 100, 1)
        
        trend = "New"
        if issue:
            if count > issue.current_count:
                trend = "Increasing"
            elif count < issue.current_count:
                trend = "Decreasing"
            else:
                trend = "Stable"
        
        priority, reasons = calc_priority(count, neg_pct, avg_rating, pct_change, persistence, evidence)
        rec = generate_recommendation(aspect)
        factors = get_contributing_factors(aspect)
        
        if issue:
            issue.name = name
            issue.related_feedback_count = count
            issue.dominant_sentiment = dominant
            issue.avg_rating = avg_rating
            issue.neg_pct = neg_pct
            issue.previous_count = prev_count
            issue.current_count = count
            issue.pct_change = pct_change
            issue.persistence_periods = persistence
            issue.trend = trend
            issue.evidence_strength = evidence
            issue.priority = priority
            issue.priority_reasons = reasons
            issue.contributing_factors = factors
            issue.recommendation = rec
            issue.updated_at = datetime.utcnow()
        else:
            issue = models.Issue(
                name=name, aspect=aspect,
                related_feedback_count=count,
                dominant_sentiment=dominant,
                avg_rating=avg_rating,
                neg_pct=neg_pct,
                previous_count=0,
                current_count=count,
                pct_change=0,
                persistence_periods=1,
                trend="New",
                evidence_strength=evidence,
                priority=priority,
                priority_reasons=reasons,
                contributing_factors=factors,
                recommendation=rec,
                status="Detected"
            )
            db.add(issue)
    
    db.commit()
