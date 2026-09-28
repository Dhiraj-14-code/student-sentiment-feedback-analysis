"""
EduPulse AI - Intelligence Engine
Handles: Issue Grouping (TF-IDF cosine), Emerging/Persistent Issue Detection,
Evidence Strength, Priority, Contributing Factors, Recommendations.

All calculations are transparent heuristics. Not scientifically validated.
"""

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from datetime import datetime, timedelta
import numpy as np

# ──────────────────────────────────────────────
# Configuration: Priority weights
# ──────────────────────────────────────────────
PRIORITY_WEIGHTS = {
    "frequency": 0.25,
    "neg_sentiment": 0.25,
    "rating_impact": 0.20,
    "growth": 0.15,
    "persistence": 0.15,
}

CONTRIBUTING_FACTORS = {
    "Teaching": ["Teaching pace", "Explanation clarity", "Practical examples", "Course difficulty"],
    "Laboratory": ["Hardware maintenance", "Software availability", "Lab scheduling", "Equipment age"],
    "Curriculum": ["Practical exposure", "Theory-to-practice ratio", "Syllabus relevance", "Learning resources"],
    "Faculty": ["Teaching methodology", "Availability for queries", "Communication style"],
    "Examination": ["Paper difficulty", "Grading transparency", "Exam scheduling", "Result delays"],
    "Infrastructure": ["Maintenance schedule", "Room availability", "Projector/board quality"],
    "Placement": ["Industry exposure", "Mock interviews", "Company diversity", "Training quality"],
    "Administration": ["Process transparency", "Response time", "Fee management"],
    "Facilities": ["Maintenance", "Availability hours", "Resource allocation"],
}

RECOMMENDATION_TEMPLATES = {
    "Laboratory": "Investigate frequently reported laboratory systems and review hardware/software maintenance requirements.",
    "Teaching": "Review teaching methodologies and assess the balance between theoretical concepts and practical examples.",
    "Curriculum": "Review the balance between theoretical and practical activities in the course curriculum.",
    "Faculty": "Conduct a review of faculty communication effectiveness and availability for student queries.",
    "Examination": "Audit examination scheduling and grading transparency for the affected semester.",
    "Infrastructure": "Inspect and schedule maintenance for reported infrastructure concerns.",
    "Placement": "Review training programs and increase industry interaction opportunities for students.",
    "Administration": "Assess administrative response times and transparency in processes flagged by students.",
    "Facilities": "Inspect reported facilities and schedule maintenance or resource allocation review.",
}


def group_similar_feedback(feedback_list, threshold=0.35):
    """
    Group feedback by TF-IDF cosine similarity.
    Returns list of groups: [{name, indices, count, sentiments, aspects}]
    """
    if len(feedback_list) < 2:
        return []
    
    texts = [f.text for f in feedback_list]
    try:
        vectorizer = TfidfVectorizer(stop_words='english', max_features=500)
        tfidf_matrix = vectorizer.fit_transform(texts)
        sim_matrix = cosine_similarity(tfidf_matrix)
    except Exception:
        return []
    
    n = len(texts)
    visited = set()
    groups = []
    
    for i in range(n):
        if i in visited:
            continue
        group_indices = [i]
        for j in range(i + 1, n):
            if j not in visited and sim_matrix[i][j] >= threshold:
                group_indices.append(j)
                visited.add(j)
        
        if len(group_indices) >= 2:  # only form groups of 2+
            visited.add(i)
            group_feedbacks = [feedback_list[k] for k in group_indices]
            sentiments = [f.sentiment_label for f in group_feedbacks]
            dominant = max(set(sentiments), key=sentiments.count)
            aspects = list(set(f.topic for f in group_feedbacks))
            # Generate issue name from most common topic
            main_topic = aspects[0] if aspects else "General"
            name = f"{main_topic} Issue"
            groups.append({
                "name": name,
                "aspect": main_topic,
                "indices": group_indices,
                "count": len(group_indices),
                "dominant_sentiment": dominant,
                "aspects": aspects,
                "feedbacks": group_feedbacks,
                "neg_pct": round(sentiments.count("Negative") / len(sentiments) * 100, 1),
                "avg_rating": round(sum(f.rating for f in group_feedbacks) / len(group_feedbacks), 2),
            })
    
    return groups


def detect_emerging_issues(feedbacks_all):
    """
    Compare last 30 days vs previous 30 days per topic.
    Returns dict of {topic: {prev, current, pct_change, dominant_sentiment}}.
    Only flags if pct_change > 30%.
    """
    now = datetime.utcnow()
    current_start = now - timedelta(days=30)
    previous_start = now - timedelta(days=60)
    
    current = [f for f in feedbacks_all if f.created_at >= current_start]
    previous = [f for f in feedbacks_all if previous_start <= f.created_at < current_start]
    
    if not previous:
        return None  # Insufficient historical data
    
    from collections import Counter
    cur_topics = Counter(f.topic for f in current)
    prev_topics = Counter(f.topic for f in previous)
    
    emerging = {}
    for topic in cur_topics:
        cur_c = cur_topics[topic]
        prev_c = prev_topics.get(topic, 0)
        if prev_c == 0:
            pct_change = 100.0
        else:
            pct_change = round((cur_c - prev_c) / prev_c * 100, 1)
        
        if pct_change > 30 and cur_c >= 3:  # meaningful threshold
            topic_fb = [f for f in current if f.topic == topic]
            sentiments = [f.sentiment_label for f in topic_fb]
            dominant = max(set(sentiments), key=sentiments.count) if sentiments else "Neutral"
            emerging[topic] = {
                "topic": topic,
                "previous_count": prev_c,
                "current_count": cur_c,
                "pct_change": pct_change,
                "dominant_sentiment": dominant,
                "neg_pct": round(sentiments.count("Negative") / len(sentiments) * 100, 1) if sentiments else 0,
            }
    
    return emerging


def calc_evidence_strength(count, neg_pct, persistence, affected_semesters):
    """Transparent heuristic, not scientifically validated."""
    score = 0
    if count >= 30:
        score += 3
    elif count >= 10:
        score += 2
    elif count >= 5:
        score += 1
    
    if neg_pct >= 70:
        score += 3
    elif neg_pct >= 50:
        score += 2
    elif neg_pct >= 30:
        score += 1
    
    if persistence >= 3:
        score += 2
    elif persistence >= 2:
        score += 1
    
    if affected_semesters >= 3:
        score += 1
    
    if score >= 7:
        return "Strong"
    elif score >= 4:
        return "Moderate"
    else:
        return "Weak"


def calc_priority(count, neg_pct, avg_rating, pct_change, persistence, evidence_strength):
    """Transparent scoring. Returns (priority_label, reasons_list)."""
    score = 0
    reasons = []
    
    # Frequency
    if count >= 30:
        score += 25
        reasons.append(f"{count} related responses")
    elif count >= 15:
        score += 15
        reasons.append(f"{count} related responses")
    elif count >= 5:
        score += 5
    
    # Negative sentiment
    if neg_pct >= 75:
        score += 25
        reasons.append(f"{neg_pct}% negative sentiment")
    elif neg_pct >= 50:
        score += 15
        reasons.append(f"{neg_pct}% negative sentiment")
    elif neg_pct >= 30:
        score += 8
    
    # Rating impact
    if avg_rating and avg_rating <= 2:
        score += 20
        reasons.append(f"Average rating {avg_rating}/5 (very low)")
    elif avg_rating and avg_rating <= 3:
        score += 10
        reasons.append(f"Average rating {avg_rating}/5")
    
    # Growth
    if pct_change >= 60:
        score += 15
        reasons.append(f"+{pct_change}% growth vs previous period")
    elif pct_change >= 30:
        score += 8
        reasons.append(f"+{pct_change}% growth vs previous period")
    
    # Persistence
    if persistence >= 3:
        score += 15
        reasons.append(f"Persistent for {persistence} periods")
    elif persistence >= 2:
        score += 8
        reasons.append(f"Observed across {persistence} periods")
    
    if score >= 70:
        return "CRITICAL", reasons
    elif score >= 45:
        return "HIGH", reasons
    elif score >= 20:
        return "MEDIUM", reasons
    else:
        return "LOW", reasons


def generate_recommendation(aspect):
    return RECOMMENDATION_TEMPLATES.get(aspect, f"Investigate the reported {aspect} concerns and determine corrective actions.")


def get_contributing_factors(aspect):
    return CONTRIBUTING_FACTORS.get(aspect, ["Resource allocation", "Process review", "Communication"])
