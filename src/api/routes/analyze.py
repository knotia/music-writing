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

@router.post("/analyze", response_model=ExpertFeedback, tags=["Analysis"])
async def analyze_musical_thought(
    request: UserAnalysisRequest, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    사용자의 음악적 사고 문장을 받아 논리성을 평가하고 
    전문가 피드백을 반환하는 엔드포인트입니다. (인증 필요)
    """
    
    if not request.raw_sentence or len(request.raw_sentence.strip()) < 5:
        raise HTTPException(status_code=400, detail="분석하기에 문장이 너무 짧거나 비어있습니다.")

    try:
        feedback = get_musical_analysis_feedback(request)
        
        # DB에 분석 이력 저장
        combined_feedback = f"[음악적 글쓰기 Tip]\n{feedback.musical_writing_tip}\n\n[종합 평가]\n"
        for eval_item in feedback.evaluations:
            combined_feedback += f"- {eval_item.category} ({eval_item.score}/5점): {eval_item.problem_and_advice}\n"
            
        combined_feedback += f"\n[첨삭 원문]\n{feedback.marked_sentence}\n"
        combined_feedback += f"\n[꼬리 질문]\n{feedback.guiding_question}"

        new_history = AnalysisHistory(
            user_id=current_user.id,
            raw_sentence=request.raw_sentence,
            error_type="none", # 이제 통합 평가로 바뀌었으므로 임의 처리 (필요시 DB 모델 수정 권장)
            thinking_structure=feedback.thinking_structure,
            translated_sentence=feedback.translated_expert_sentence,
            educational_feedback=combined_feedback
        )
        db.add(new_history)
        db.commit()
        
        return feedback
    except ValueError as ve:
        print(f"Configuration Error: {ve}")
        raise HTTPException(status_code=500, detail="서버 내부 설정 오류가 발생했습니다. 잠시 후 다시 시도해주세요.")
    except Exception as e:
        print(f"Error during LLM call or DB save: {e}")
        raise HTTPException(status_code=500, detail="처리 중 오류가 발생했습니다.")
