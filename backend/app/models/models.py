from sqlalchemy import Column, Integer, String, Float, Text, ForeignKey, DateTime, Boolean, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(100), unique=True, index=True)
    hashed_password = Column(String(255))
    is_admin = Column(Boolean, default=False)
    feedbacks = relationship("Feedback", back_populates="user")

class Feedback(Base):
    __tablename__ = "feedbacks"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    department = Column(String(50))
    semester = Column(String(20))
    subject = Column(String(100))
    rating = Column(Integer)
    text = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sentiment_label = Column(String(20))
    sentiment_score = Column(Float)
    topic = Column(String(50))
    
    # New fields
    feedback_quality = Column(String(20), default="Detailed")  # Detailed / Low-information
    aspects = Column(JSON, default=dict)  # {aspect: {sentiment, score}}
    worked_well = Column(JSON, default=list)
    needs_improvement = Column(JSON, default=list)
    
    user = relationship("User", back_populates="feedbacks")

class Issue(Base):
    __tablename__ = "issues"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200))
    aspect = Column(String(50))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Computed from feedback grouping
    related_feedback_count = Column(Integer, default=0)
    dominant_sentiment = Column(String(20))
    avg_rating = Column(Float)
    neg_pct = Column(Float, default=0)
    
    # Trend/persistence
    previous_count = Column(Integer, default=0)
    current_count = Column(Integer, default=0)
    pct_change = Column(Float, default=0)
    persistence_periods = Column(Integer, default=1)
    trend = Column(String(20), default="New")  # New/Increasing/Decreasing/Stable/Resolved
    
    # Evidence & Priority
    evidence_strength = Column(String(20), default="Weak")  # Weak/Moderate/Strong
    priority = Column(String(20), default="LOW")  # LOW/MEDIUM/HIGH/CRITICAL
    priority_reasons = Column(JSON, default=list)
    
    # Contributing factors
    contributing_factors = Column(JSON, default=list)
    
    # Recommendation
    recommendation = Column(Text)
    
    # Lifecycle
    status = Column(String(30), default="Detected")
    # Detected / Under Review / Action Planned / Action Implemented / Monitoring / Resolved
    admin_notes = Column(Text)
    
    interventions = relationship("Intervention", back_populates="issue")

class Intervention(Base):
    __tablename__ = "interventions"
    id = Column(Integer, primary_key=True, index=True)
    issue_id = Column(Integer, ForeignKey("issues.id"))
    action_taken = Column(Text)
    action_date = Column(DateTime, default=datetime.utcnow)
    notes = Column(Text)
    
    # Before/after snapshot
    before_neg_pct = Column(Float)
    before_avg_rating = Column(Float)
    before_feedback_count = Column(Integer)
    
    after_neg_pct = Column(Float)
    after_avg_rating = Column(Float)
    after_feedback_count = Column(Integer)
    
    issue = relationship("Issue", back_populates="interventions")
