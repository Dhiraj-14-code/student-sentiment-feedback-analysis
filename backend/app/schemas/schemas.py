from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    is_admin: bool = False

class User(UserBase):
    id: int
    is_admin: bool
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class FeedbackBase(BaseModel):
    department: str
    semester: str
    subject: str
    rating: int
    text: Optional[str] = ""
    worked_well: Optional[List[str]] = []
    needs_improvement: Optional[List[str]] = []

class FeedbackCreate(FeedbackBase):
    pass

class Feedback(FeedbackBase):
    id: int
    user_id: int
    created_at: datetime
    sentiment_label: Optional[str] = None
    sentiment_score: Optional[float] = None
    topic: Optional[str] = None
    feedback_quality: Optional[str] = None
    aspects: Optional[Dict[str, Any]] = None
    worked_well: Optional[List[str]] = []
    needs_improvement: Optional[List[str]] = []
    class Config:
        from_attributes = True

# Issue schemas
class IssueStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

class InterventionCreate(BaseModel):
    action_taken: str
    action_date: Optional[datetime] = None
    notes: Optional[str] = None

class Intervention(BaseModel):
    id: int
    issue_id: int
    action_taken: str
    action_date: datetime
    notes: Optional[str] = None
    before_neg_pct: Optional[float] = None
    before_avg_rating: Optional[float] = None
    after_neg_pct: Optional[float] = None
    after_avg_rating: Optional[float] = None
    class Config:
        from_attributes = True

class Issue(BaseModel):
    id: int
    name: str
    aspect: str
    related_feedback_count: int
    dominant_sentiment: Optional[str] = None
    avg_rating: Optional[float] = None
    neg_pct: Optional[float] = None
    previous_count: Optional[int] = None
    current_count: Optional[int] = None
    pct_change: Optional[float] = None
    persistence_periods: Optional[int] = None
    trend: Optional[str] = None
    evidence_strength: Optional[str] = None
    priority: Optional[str] = None
    priority_reasons: Optional[List[str]] = None
    contributing_factors: Optional[List[str]] = None
    recommendation: Optional[str] = None
    status: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    interventions: Optional[List[Intervention]] = None
    class Config:
        from_attributes = True
