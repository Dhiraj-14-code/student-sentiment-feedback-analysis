from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models import models
from .dependencies import get_current_admin_user
from ..services.intelligence import (
    detect_emerging_issues, calc_evidence_strength,
    calc_priority, generate_recommendation, get_contributing_factors
)
from collections import Counter
from datetime import datetime, timedelta

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/overview")
def get_overview(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    total = db.query(models.Feedback).count()
    if total == 0:
        return {"total_feedback": 0, "positive_pct": 0, "negative_pct": 0, "neutral_pct": 0, "avg_rating": 0, "detailed_pct": 0}
    
    pos = db.query(models.Feedback).filter(models.Feedback.sentiment_label == "Positive").count()
    neg = db.query(models.Feedback).filter(models.Feedback.sentiment_label == "Negative").count()
    neu = db.query(models.Feedback).filter(models.Feedback.sentiment_label == "Neutral").count()
    detailed = db.query(models.Feedback).filter(models.Feedback.feedback_quality == "Detailed").count()
    avg_rating = db.query(func.avg(models.Feedback.rating)).scalar()
    active_issues = db.query(models.Issue).filter(models.Issue.status != "Resolved").count()
    high_critical = db.query(models.Issue).filter(models.Issue.priority.in_(["HIGH", "CRITICAL"])).count()
    
    return {
        "total_feedback": total,
        "positive_pct": round((pos / total) * 100, 2),
        "negative_pct": round((neg / total) * 100, 2),
        "neutral_pct": round((neu / total) * 100, 2),
        "detailed_pct": round((detailed / total) * 100, 2),
        "avg_rating": round(avg_rating, 2) if avg_rating else 0,
        "active_issues": active_issues,
        "high_critical_issues": high_critical,
    }

@router.get("/sentiment")
def get_sentiment(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    stats = db.query(models.Feedback.sentiment_label, func.count(models.Feedback.id)).group_by(models.Feedback.sentiment_label).all()
    return [{"name": s[0], "value": s[1]} for s in stats]

@router.get("/topics")
def get_topics(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    stats = db.query(models.Feedback.topic, func.count(models.Feedback.id)).group_by(models.Feedback.topic).all()
    return [{"name": s[0], "value": s[1]} for s in stats]

@router.get("/trends")
def get_trends(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    feedbacks = db.query(models.Feedback).all()
    trends_map = {}
    for f in feedbacks:
        date_str = f.created_at.strftime("%Y-%m-%d")
        if date_str not in trends_map:
            trends_map[date_str] = {"date": date_str, "Positive": 0, "Negative": 0, "Neutral": 0}
        if f.sentiment_label in trends_map[date_str]:
            trends_map[date_str][f.sentiment_label] += 1
    return list(trends_map.values())

@router.get("/emerging-issues")
def get_emerging_issues(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    all_feedbacks = db.query(models.Feedback).all()
    if len(all_feedbacks) < 5:
        return {"status": "insufficient_data", "message": "Insufficient historical data to detect emerging issues."}
    
    result = detect_emerging_issues(all_feedbacks)
    if result is None:
        return {"status": "insufficient_data", "message": "Insufficient historical data - need at least 2 periods of feedback."}
    
    return {"status": "ok", "emerging_issues": list(result.values())}

@router.get("/aspect-health")
def get_aspect_health(db: Session = Depends(get_db), current_admin: models.User = Depends(get_current_admin_user)):
    """Returns per-aspect sentiment breakdown."""
    feedbacks = db.query(models.Feedback).all()
    aspect_data = {}
    
    for f in feedbacks:
        if f.aspects:
            for aspect, data in f.aspects.items():
                if aspect not in aspect_data:
                    aspect_data[aspect] = {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
                aspect_data[aspect][data["sentiment"].lower()] += 1
                aspect_data[aspect]["total"] += 1
    
    # Also count from main topic
    for f in feedbacks:
        if f.topic and f.topic != "Other":
            if f.topic not in aspect_data:
                aspect_data[f.topic] = {"positive": 0, "negative": 0, "neutral": 0, "total": 0}
            if f.sentiment_label:
                aspect_data[f.topic][f.sentiment_label.lower()] += 1
                aspect_data[f.topic]["total"] += 1
    
    result = []
    for aspect, counts in aspect_data.items():
        total = counts["total"]
        if total == 0:
            continue
        health_score = round((counts["positive"] / total) * 100, 1)
        result.append({
            "aspect": aspect,
            "total": total,
            "positive": counts["positive"],
            "negative": counts["negative"],
            "neutral": counts["neutral"],
            "health_score": health_score,
        })
    
    return sorted(result, key=lambda x: x["health_score"])
