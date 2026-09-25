from datetime import datetime
import json
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker, Session

DATABASE_URL = "sqlite:///./webguard.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

class Scan(Base):
    __tablename__ = "scans"
    id = Column(Integer, primary_key=True, index=True)
    url = Column(String(1000), nullable=False)
    security = Column(Float, default=0)
    performance = Column(Float, default=0)
    seo = Column(Float, default=0)
    accessibility = Column(Float, default=0)
    overall = Column(Float, default=0)
    issues = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI(title="WebGuard API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScanIn(BaseModel):
    url: str
    security: float = 0
    performance: float = 0
    seo: float = 0
    accessibility: float = 0
    overall: float = 0
    issues: list = []

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ai_style_recommendations(issues):
    recommendations = []
    for issue in issues:
        text = str(issue).lower()
        if "https" in text:
            recommendations.append("Use HTTPS everywhere and redirect HTTP traffic to HTTPS.")
        elif "alt" in text:
            recommendations.append("Add descriptive alt text to meaningful images.")
        elif "title" in text:
            recommendations.append("Add a concise, descriptive page title.")
        elif "description" in text:
            recommendations.append("Add a useful meta description for search previews.")
        elif "performance" in text or "load" in text:
            recommendations.append("Reduce large assets and defer non-critical JavaScript.")
        elif "viewport" in text:
            recommendations.append("Add a responsive viewport meta tag.")
        else:
            recommendations.append("Review this issue and verify the page after fixing it.")
    return list(dict.fromkeys(recommendations))

@app.get("/")
def root():
    return {"name": "WebGuard API", "status": "running"}

@app.post("/api/scans")
def create_scan(payload: ScanIn, db: Session = Depends(get_db)):
    scan = Scan(
        url=payload.url,
        security=payload.security,
        performance=payload.performance,
        seo=payload.seo,
        accessibility=payload.accessibility,
        overall=payload.overall,
        issues=json_string(payload.issues),
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)
    return {
        "id": scan.id,
        "message": "Scan saved",
        "recommendations": ai_style_recommendations(payload.issues)
    }

@app.get("/api/scans")
def get_scans(limit: int = 50, db: Session = Depends(get_db)):
    rows = db.query(Scan).order_by(Scan.created_at.desc()).limit(limit).all()
    return [serialize_scan(x) for x in rows]

@app.get("/api/scans/{scan_id}")
def get_scan(scan_id: int, db: Session = Depends(get_db)):
    scan = db.query(Scan).filter(Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(404, "Scan not found")
    return serialize_scan(scan)

def json_string(value):
    import json
    return json.dumps(value)

def serialize_scan(x):
    import json
    try:
        issues = json.loads(x.issues or "[]")
    except Exception:
        issues = []
    return {
        "id": x.id,
        "url": x.url,
        "security": x.security,
        "performance": x.performance,
        "seo": x.seo,
        "accessibility": x.accessibility,
        "overall": x.overall,
        "issues": issues,
        "created_at": x.created_at.isoformat() if x.created_at else None,
    }
