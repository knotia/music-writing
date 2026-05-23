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

class RecentFeedback(BaseModel):
    raw_sentence: str
    translated_expert_sentence: str
    educational_feedback: str

class ProgressReport(BaseModel):
    total_entries: int
    most_frequent_error: str
    recent_feedback: Optional[RecentFeedback]
    # 상세 지표
    grammar_and_spelling: str
    coherence_and_flow: str
    musical_depth: str
    overall_progress_feedback: str

@router.get("/progress", response_model=ProgressReport)
async def get_progress_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    학생의 누적된 데이터를 바탕으로 다양한 항목(문법, 결속성, 음악적 깊이)을 분석하고 최근 피드백을 반환합니다.
    """
    histories = db.query(AnalysisHistory).filter(AnalysisHistory.user_id == current_user.id).order_by(AnalysisHistory.created_at.asc()).all()
    
    if not histories:
        return ProgressReport(
            total_entries=0,
            most_frequent_error="없음",
            recent_feedback=None,
            grammar_and_spelling="데이터가 부족합니다.",
            coherence_and_flow="데이터가 부족합니다.",
            musical_depth="데이터가 부족합니다.",
            overall_progress_feedback="분석을 위해 먼저 감상평을 입력해보세요."
        )

    total_entries = len(histories)
    error_counts = {}
    history_texts = []
    
    for idx, h in enumerate(histories):
        err = h.error_type
        error_counts[err] = error_counts.get(err, 0) + 1
        history_texts.append(f"[{idx+1}회차] 문장: {h.raw_sentence}")

    most_frequent_error = max(error_counts, key=error_counts.get) if error_counts else "none"
    
    recent_h = histories[-1]
    recent_feedback = RecentFeedback(
        raw_sentence=recent_h.raw_sentence or "",
        translated_expert_sentence=recent_h.translated_sentence or "",
        educational_feedback=recent_h.educational_feedback or ""
    )

    if client:
        prompt = f"""
당신은 학생의 음악적 사고와 작문 능력을 꼼꼼하게 평가하는 교육자입니다.
아래는 해당 학생이 시간에 따라 작성한 감상평 문장들입니다.
이 기록들을 보고 아래의 세부 항목에 대해 자세하게 평가해주세요.

기록:
{chr(10).join(history_texts)}
"""
        try:
            class LLMProgress(BaseModel):
                grammar_and_spelling: str
                coherence_and_flow: str
                musical_depth: str
                overall_progress_feedback: str

            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=LLMProgress,
                    temperature=0.7,
                ),
            )
            parsed = response.parsed
            
            grammar = parsed.grammar_and_spelling
            coherence = parsed.coherence_and_flow
            depth = parsed.musical_depth
            overall = parsed.overall_progress_feedback
            
        except Exception as e:
            print("LLM Error in Progress:", e)
            grammar = "AI 분석 중 오류가 발생했습니다."
            coherence = "AI 분석 중 오류가 발생했습니다."
            depth = "AI 분석 중 오류가 발생했습니다."
            overall = "잠시 후 다시 시도해주세요."
    else:
        grammar = "API 키가 설정되지 않았습니다."
        coherence = "API 키가 설정되지 않았습니다."
        depth = "API 키가 설정되지 않았습니다."
        overall = "Gemini API 키를 설정해주세요."

    return ProgressReport(
        total_entries=total_entries,
        most_frequent_error=most_frequent_error,
        recent_feedback=recent_feedback,
        grammar_and_spelling=grammar,
        coherence_and_flow=coherence,
        musical_depth=depth,
        overall_progress_feedback=overall
    )
