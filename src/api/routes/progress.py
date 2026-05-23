import sys
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from google.genai import types

sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))
from src.api.database import get_db
from src.api.models import User, AnalysisHistory
from src.api.routes.auth import get_current_user
from src.api.llm_client import client

router = APIRouter(prefix="/analyze", tags=["Analysis"])

import re

class RecentFeedback(BaseModel):
    raw_sentence: str
    translated_expert_sentence: str
    educational_feedback: str

class CategoryScore(BaseModel):
    subject: str
    A: int
    fullMark: int = 5

class TrendData(BaseModel):
    name: str
    score: int

class ProgressReport(BaseModel):
    total_entries: int
    radar_data: List[CategoryScore]
    trend_data: List[TrendData]
    improvements_needed: List[str]
    recent_feedback: Optional[RecentFeedback]

@router.get("/progress", response_model=ProgressReport)
async def get_progress_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    학생의 누적된 데이터를 파싱하여 차트 시각화용 데이터를 반환합니다.
    """
    histories = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id).order_by(AnalysisHistory.created_at.asc()).all()
    
    if not histories:
        return ProgressReport(
            total_entries=0,
            radar_data=[],
            trend_data=[],
            improvements_needed=[],
            recent_feedback=None
        )

    total_entries = len(histories)
    
    # 1. 정규식을 통한 피드백 파싱
    eval_pattern = re.compile(r"-\s*\*\*(.*?)(?:\s*\((\d)\/5\))?\*\*\s*:\s*(.*)")
    
    category_totals = {}
    category_counts = {}
    trend_data = []
    improvements = []
    
    for idx, h in enumerate(histories):
        text = h.educational_feedback or ""
        # evaluations 섹션 추출
        evals_section = ""
        match = re.search(r"#\s*evaluations\s*\n([\s\S]*)", text, re.IGNORECASE)
        if match:
            evals_section = match.group(1)
        
        entry_total_score = 0
        entry_items = 0
        
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
                
                category_totals[cat] = category_totals.get(cat, 0) + score
                category_counts[cat] = category_counts.get(cat, 0) + 1
                
                entry_total_score += score
                entry_items += 1
                
                # 최근 3개 기록 중 3점 이하인 항목을 개선점으로 추가
                if idx >= len(histories) - 3 and score <= 3:
                    improvements.append(f"[{cat} 보완점] {advice}")

        # Trend Data (총점의 평균을 100점 만점으로 환산)
        if entry_items > 0:
            avg = (entry_total_score / entry_items) * 20 # 5점 만점 -> 100점 만점
            trend_data.append(TrendData(name=f"{idx+1}회차", score=int(avg)))
        else:
            trend_data.append(TrendData(name=f"{idx+1}회차", score=0))
            
    # Radar Data 생성 (평균 계산)
    radar_data = []
    for cat in category_totals:
        avg_score = round(category_totals[cat] / category_counts[cat])
        radar_data.append(CategoryScore(subject=cat, A=avg_score, fullMark=5))
        
    # 만약 취약점이 없다면 칭찬 문구 추가
    if not improvements:
        improvements.append("전반적으로 매우 훌륭한 작성 능력을 유지하고 있습니다. 현재의 논리적이고 객관적인 톤을 계속 유지해 주세요!")
        
    # 역순 정렬 후 최대 5개까지만 노출
    improvements.reverse()
    improvements = improvements[:5]
    
    recent_h = histories[-1]
    
    # Translation section 추출
    translation = ""
    tr_match = re.search(r"#\s*translation\s*\n([\s\S]*?)(?=\n#|$)", recent_h.educational_feedback or "", re.IGNORECASE)
    if tr_match:
        translation = tr_match.group(1).strip()

    recent_feedback = RecentFeedback(
        raw_sentence=recent_h.raw_sentence or "",
        translated_expert_sentence=translation or "데이터 없음",
        educational_feedback=recent_h.educational_feedback or ""
    )

    return ProgressReport(
        total_entries=total_entries,
        radar_data=radar_data,
        trend_data=trend_data,
        improvements_needed=improvements,
        recent_feedback=recent_feedback
    )
