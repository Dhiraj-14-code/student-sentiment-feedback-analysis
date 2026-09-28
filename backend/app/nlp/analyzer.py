from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
import re

analyzer = SentimentIntensityAnalyzer()

TOPICS = [
    "Teaching", "Faculty", "Infrastructure", "Laboratory",
    "Examination", "Curriculum", "Placement", "Administration", "Facilities"
]

TOPIC_KEYWORDS = {
    "Teaching": ["teach", "explain", "understand", "lecture", "class", "method", "pace", "concept", "clarity"],
    "Faculty": ["teacher", "professor", "faculty", "staff", "sir", "madam", "instructor"],
    "Infrastructure": ["building", "classroom", "desk", "board", "projector", "campus", "room", "hall"],
    "Laboratory": ["lab", "equipment", "computer", "practical", "software", "hardware", "pc", "system", "freeze", "slow"],
    "Examination": ["exam", "test", "marks", "grading", "evaluation", "result", "schedule", "paper"],
    "Curriculum": ["syllabus", "course", "subject", "curriculum", "content", "learn", "practical", "theory"],
    "Placement": ["placement", "job", "company", "interview", "training", "career", "internship"],
    "Administration": ["admin", "office", "management", "fees", "registration", "staff"],
    "Facilities": ["canteen", "hostel", "library", "sports", "water", "washroom", "wifi", "internet"]
}

def clean_text(text: str) -> str:
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text.lower().strip()

def analyze_sentiment(text: str):
    scores = analyzer.polarity_scores(text)
    compound = scores['compound']
    if compound >= 0.05:
        label = "Positive"
    elif compound <= -0.05:
        label = "Negative"
    else:
        label = "Neutral"
    return label, compound

def detect_topic(text: str) -> str:
    cleaned = clean_text(text)
    words = cleaned.split()
    topic_scores = {topic: 0 for topic in TOPICS}
    for word in words:
        for topic, keywords in TOPIC_KEYWORDS.items():
            if word in keywords:
                topic_scores[topic] += 1
    best_topic = max(topic_scores, key=topic_scores.get)
    if topic_scores[best_topic] == 0:
        return "Other"
    return best_topic

def analyze_aspects(text: str) -> dict:
    """
    Split text by conjunctions/punctuation into segments and run VADER per segment.
    Returns {aspect: {sentiment, score}} for matched aspects.
    """
    segments = re.split(r'[,;.]+|but|however|although|though', text, flags=re.IGNORECASE)
    aspects = {}
    cleaned_full = clean_text(text)
    
    for segment in segments:
        segment = segment.strip()
        if not segment:
            continue
        seg_clean = clean_text(segment)
        seg_words = seg_clean.split()
        scores = analyzer.polarity_scores(segment)
        compound = scores['compound']
        
        for topic, keywords in TOPIC_KEYWORDS.items():
            for word in seg_words:
                if word in keywords:
                    if topic not in aspects:
                        label = "Positive" if compound >= 0.05 else ("Negative" if compound <= -0.05 else "Neutral")
                        aspects[topic] = {"sentiment": label, "score": round(compound, 3)}
                    break  # one match per topic per segment is enough
    
    return aspects

def assess_feedback_quality(text: str) -> str:
    """Heuristic: Detailed if >= 8 words and not all generic."""
    generic_phrases = {"good", "ok", "okay", "fine", "nice", "bad", "poor", "great", "average"}
    cleaned = clean_text(text)
    words = cleaned.split()
    if len(words) >= 8 and cleaned not in generic_phrases:
        return "Detailed"
    return "Low-information"

def process_feedback(text: str):
    label, score = analyze_sentiment(text)
    topic = detect_topic(text)
    aspects = analyze_aspects(text)
    quality = assess_feedback_quality(text)
    return label, score, topic, aspects, quality
