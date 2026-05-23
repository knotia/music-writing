from pydantic import BaseModel, Field
from typing import Optional, List

class ThinkingElements(BaseModel):
    """사용자의 자연어 문장에서 추출된 음악적 사고 요소들"""
    tone_choice: Optional[str] = Field(None, description="톤(음조)에 대한 분석. 예: 'C 대조 D 조'")
    rhythm_pattern: Optional[str] = Field(None, description="리듬에 대한 분석. 예: '빠른 4/4 박자'")
    emotional_impact: Optional[str] = Field(None, description="전달하고자 하는 감정이나 분위기. 예: '긴장감', '슬픔'")
    harmony: Optional[str] = Field(None, description="화성학적 분석 (선택). 예: '단조로운 화음'")
    instrumentation: Optional[str] = Field(None, description="악기 구성 (선택). 예: '강한 피아노 타건'")

class UserAnalysisRequest(BaseModel):
    """사용자로부터 입력받는 분석 요청 데이터 구조"""
    user_id: str = Field(..., description="사용자 고유 식별자")
    session_id: str = Field(..., description="분석 세션 ID")
    raw_sentence: str = Field(..., description="사용자가 작성한 자연어 분석 문장")
    assignment_question: Optional[str] = Field(None, description="학생이 답변하고자 하는 원본 과제 질문 또는 논제")
    history: Optional[List[dict]] = Field(None, description="대화형 진행 시 이전 꼬리 질문 및 답변 기록")
    target_music_id: Optional[str] = Field(None, description="분석 대상이 되는 곡의 ID (있는 경우)")
    extracted_elements: Optional[ThinkingElements] = Field(None, description="AI 모델에 의해 1차적으로 추출된 사고 요소들")
