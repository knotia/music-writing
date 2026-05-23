import sys
import os
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session

# 상위 폴더 경로 인식을 위해
sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))
from schemas.user_analysis import UserAnalysisRequest
from schemas.feedback import ExpertFeedback
from src.api.llm_client import get_musical_analysis_feedback
from src.api.database import get_db
from src.api.models import User, AnalysisHistory
from src.api.routes.auth import get_current_user

router = APIRouter()

from fastapi.responses import StreamingResponse

@router.post("/analyze", tags=["Analysis"])
async def analyze_musical_thought(
    request: UserAnalysisRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자의 음악적 사고 문장을 받아 논리성을 평가하고 
    전문가 피드백을 실시간 마크다운 스트리밍으로 반환합니다.
    """
    if not request.raw_sentence or len(request.raw_sentence.strip()) < 5:
        raise HTTPException(status_code=400, detail="분석하기에 문장이 너무 짧거나 비어있습니다.")

    try:
        def stream_generator():
            full_text = ""
            for chunk in get_musical_analysis_feedback(request):
                full_text += chunk
                yield chunk
            
            # 스트리밍 종료 후 DB에 저장
            try:
                new_history = AnalysisHistory(
                    user_id=current_user.id,
                    raw_sentence=request.raw_sentence,
                    error_type="none",
                    thinking_structure="",
                    translated_sentence="",
                    educational_feedback=full_text
                )
                db.add(new_history)
                db.commit()
            except Exception as e:
                print(f"DB Save Error after stream: {e}")

        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    except Exception as e:
        print(f"Error initializing stream: {e}")
        raise HTTPException(status_code=500, detail="처리 중 오류가 발생했습니다.")
