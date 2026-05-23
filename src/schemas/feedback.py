from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class ErrorType(str, Enum):
    NONE = "none"
    TONE_CONFUSION = "tone_confusion"           # 톤 혼동
    KEY_STRUCTURE_ERROR = "key_structure_error" # 조 구조 오류
    RHYTHM_ERROR = "rhythm_error"               # 리듬 해석 오류
    STRUCTURE_AMBIGUITY = "structure_ambiguity" # 구조적 모호성

class ThinkingStructureType(str, Enum):
    SEQUENTIAL = "sequential"   # 순차적
    REPETITIVE = "repetitive"   # 반복적
    CONTRASTIVE = "contrastive" # 대조적
    INTEGRATIVE = "integrative" # 융합적

class EvaluationItem(BaseModel):
    """종합 평가 항목 (음악적 타당성, 작문 및 문장력, 논리적 전개 등)"""
    category: str = Field(..., description="평가 항목 이름 (예: '음악적 타당성', '작문 및 문장력', '논리적 전개')")
    score: int = Field(..., description="1점부터 5점까지의 별점 점수 (1: 매우 부족, 5: 매우 우수)")
    problem_and_advice: str = Field(..., description="해당 항목에서 발견된 구체적인 문제점 및 오류 지적, 그리고 개선을 위한 팁")

class ExpertFeedback(BaseModel):
    """최종 생성된 대화형 AI 피드백 데이터 모델"""
    feedback_id: str = Field(..., description="피드백 고유 식별자")
    user_session_id: str = Field(..., description="매칭되는 사용자의 분석 세션 ID")
    thinking_structure: ThinkingStructureType = Field(..., description="분류된 사용자의 사고 흐름 방식")
    
    guiding_question: str = Field(..., description="학생이 스스로 더 깊이 생각하고 글을 발전시킬 수 있도록 유도하는 소크라테스식 꼬리 질문 (대화 유도용)")
    marked_sentence: str = Field(..., description="사용자의 원문을 바탕으로 틀린 부분은 ~~틀린부분~~ 으로, 고친 부분은 **고친부분** 으로 마크업하여 직접 첨삭한 문장 (오류가 없으면 원문 그대로 반환)")
    
    evaluations: List[EvaluationItem] = Field(..., description="음악적 타당성, 작문 및 문장력, 논리적 전개 등 항목별 점수와 구체적인 문제점 지적 목록")
    musical_writing_tip: str = Field(..., description="전반적인 음악적 글쓰기 능력을 향상시키기 위한 총평 및 글쓰기 Tip")
    translated_expert_sentence: str = Field(..., description="전문가 수준의 용어로 번역된 최종 분석 문장")
