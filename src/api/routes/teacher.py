import os
import sys
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import func

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

class StudentSummary(BaseModel):
    id: int
    username: str
    total_entries: int
    latest_error: Optional[str]

@router.get("/students", response_model=List[StudentSummary])
def get_students(db: Session = Depends(get_db), current_user: User = Depends(get_teacher_user)):
    """
    선생님용 엔드포인트: 가입된 모든 학생의 요약 정보를 반환합니다.
    """
    students = db.query(User).filter(User.role == "student").all()
    
    result = []
    for st in students:
        histories = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == st.id).order_by(AnalysisHistory.created_at.desc()).all()
        total_entries = len(histories)
        latest_error = histories[0].error_type if histories else "기록 없음"
        
        result.append(
            StudentSummary(
                id=st.id,
                username=st.username,
                total_entries=total_entries,
                latest_error=latest_error
            )
        )
    return result

@router.get("/students/{student_id}/progress")
async def get_student_progress(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_teacher_user)):
    """
    선생님용 엔드포인트: 특정 학생의 성장 리포트를 반환합니다. (progress 모듈의 로직을 재활용)
    """
    student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    return await get_progress_report(db=db, current_user=student)
