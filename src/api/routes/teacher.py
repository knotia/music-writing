import os
import sys
import re
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import func
from datetime import datetime, timedelta

sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))
from src.api.database import get_db
from src.api.models import User, AnalysisHistory
from src.api.routes.auth import get_current_user
from src.api.routes.progress import get_progress_report

router = APIRouter(prefix="/teacher", tags=["Teacher"])

def get_teacher_user(current_user: User = Depends(get_current_user)):
    if current_user.role != "teacher":
        raise HTTPException(status_code=403, detail="Not authorized. Teacher role required.")
    return current_user

# ──────────────── Pydantic Models ────────────────

class StudentSummary(BaseModel):
    id: int
    username: str
    total_entries: int
    latest_error: Optional[str]
    last_active: Optional[str]
    avg_score: Optional[int]

class ClassOverview(BaseModel):
    total_students: int
    total_entries: int
    active_this_week: int
    class_avg_score: int
    top_students: List[dict]
    common_weaknesses: List[dict]

class StudentHistoryItem(BaseModel):
    id: int
    created_at: str
    raw_sentence: str
    translated_sentence: str
    educational_feedback: str

# ──────────────── Helper: 점수 파싱 ────────────────

eval_pattern = re.compile(r"-\s*\*\*(.*?)(?:\s*\((\d)\/5\))?\*\*\s*:\s*(.*)")

def parse_scores_from_feedback(feedback_text: str):
    """피드백 텍스트에서 evaluations 섹션의 점수들을 파싱"""
    evals_section = ""
    match = re.search(r"#\s*evaluations\s*\n([\s\S]*)", feedback_text, re.IGNORECASE)
    if match:
        evals_section = match.group(1)
    
    scores = []
    categories = {}
    for line in evals_section.split('\n'):
        line = line.strip()
        if not line.startswith('-'):
            continue
        m = eval_pattern.match(line)
        if m:
            cat = m.group(1).strip()
            score_str = m.group(2)
            advice = m.group(3).strip()
            score = int(score_str) if score_str else 3
            scores.append(score)
            categories[cat] = {"score": score, "advice": advice}
    
    avg = int(sum(scores) / len(scores) * 20) if scores else 0  # 100점 만점
    return avg, categories

# ──────────────── Endpoints ────────────────

@router.get("/overview", response_model=ClassOverview)
def get_class_overview(db: Session = Depends(get_db), current_user: User = Depends(get_teacher_user)):
    """학급 전체 통계 요약을 반환합니다."""
    students = db.query(User).filter(User.role == "student").all()
    all_histories = db.query(AnalysisHistory).all()
    
    total_students = len(students)
    total_entries = len(all_histories)
    
    # 이번 주 활동 학생 수
    one_week_ago = datetime.utcnow() - timedelta(days=7)
    active_ids = db.query(AnalysisHistory.user_id).filter(
        AnalysisHistory.created_at >= one_week_ago
    ).distinct().all()
    active_this_week = len(active_ids)
    
    # 학생별 평균 점수 계산
    student_scores = {}
    weakness_counter = {}
    
    for h in all_histories:
        text = h.educational_feedback or ""
        avg, categories = parse_scores_from_feedback(text)
        if avg > 0:
            if h.user_id not in student_scores:
                student_scores[h.user_id] = []
            student_scores[h.user_id].append(avg)
            
            for cat, info in categories.items():
                if info["score"] <= 3:
                    if cat not in weakness_counter:
                        weakness_counter[cat] = {"count": 0, "advice": info["advice"]}
                    weakness_counter[cat]["count"] += 1
                    weakness_counter[cat]["advice"] = info["advice"]
    
    # 학급 평균 점수
    all_avgs = []
    student_avg_map = {}
    for uid, score_list in student_scores.items():
        avg = int(sum(score_list) / len(score_list))
        all_avgs.append(avg)
        student_avg_map[uid] = avg
    
    class_avg = int(sum(all_avgs) / len(all_avgs)) if all_avgs else 0
    
    # 상위 학생 (점수순 상위 5명)
    user_map = {s.id: s.username for s in students}
    sorted_students = sorted(student_avg_map.items(), key=lambda x: x[1], reverse=True)[:5]
    top_students = [{"username": user_map.get(uid, "?"), "score": score} for uid, score in sorted_students]
    
    # 학급 공통 취약점 (빈도순 상위 5개)
    sorted_weaknesses = sorted(weakness_counter.items(), key=lambda x: x[1]["count"], reverse=True)[:5]
    common_weaknesses = [{"category": cat, "count": info["count"], "advice": info["advice"]} for cat, info in sorted_weaknesses]
    
    return ClassOverview(
        total_students=total_students,
        total_entries=total_entries,
        active_this_week=active_this_week,
        class_avg_score=class_avg,
        top_students=top_students,
        common_weaknesses=common_weaknesses
    )

@router.get("/students", response_model=List[StudentSummary])
def get_students(db: Session = Depends(get_db), current_user: User = Depends(get_teacher_user)):
    """가입된 모든 학생의 요약 정보를 반환합니다."""
    students = db.query(User).filter(User.role == "student").all()
    
    result = []
    for st in students:
        histories = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == st.id).order_by(AnalysisHistory.created_at.desc()).all()
        total_entries = len(histories)
        latest_error = histories[0].error_type if histories else "기록 없음"
        last_active = histories[0].created_at.isoformat() if histories else None
        
        # 평균 점수 계산
        scores = []
        for h in histories:
            avg, _ = parse_scores_from_feedback(h.educational_feedback or "")
            if avg > 0:
                scores.append(avg)
        avg_score = int(sum(scores) / len(scores)) if scores else None
        
        result.append(
            StudentSummary(
                id=st.id,
                username=st.username,
                total_entries=total_entries,
                latest_error=latest_error,
                last_active=last_active,
                avg_score=avg_score
            )
        )
    return result

@router.get("/students/{student_id}/progress")
async def get_student_progress(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_teacher_user)):
    """특정 학생의 성장 리포트를 반환합니다."""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return await get_progress_report(db=db, current_user=student)

@router.get("/students/{student_id}/history", response_model=List[StudentHistoryItem])
def get_student_history(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_teacher_user)):
    """특정 학생의 과거 작성 이력을 시간 역순으로 반환합니다."""
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    histories = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == student_id).order_by(AnalysisHistory.created_at.desc()).all()
    
    results = []
    for h in histories:
        results.append(StudentHistoryItem(
            id=h.id,
            created_at=h.created_at.isoformat(),
            raw_sentence=h.raw_sentence or "",
            translated_sentence=h.translated_sentence or "",
            educational_feedback=h.educational_feedback or ""
        ))
    return results
