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

class LogicEvaluation(BaseModel):
    """전문가 관점의 논리성 및 정확성 평가"""
    is_accurate: bool = Field(..., description="이론적 정확성 여부")
    error_type: ErrorType = Field(default=ErrorType.NONE, description="발견된 오류 유형")
    rationale: str = Field(..., description="정확성 평가에 대한 비판적이고 구체적인 이유 설명 (단순 칭찬 배제)")

class GrammarEvaluation(BaseModel):
    """국어 문법 및 오타 분석 결과"""
    has_errors: bool = Field(..., description="오타 또는 문법 오류 존재 여부")
    corrections: List[str] = Field(..., description="구체적인 오타 및 문법 교정 내용 목록 (오류가 없으면 빈 배열)")
    feedback: str = Field(..., description="전반적인 문장력 및 표현 개선을 위한 조언")

class ExpertFeedback(BaseModel):
    """최종 생성된 AI 및 전문가 피드백 데이터 모델"""
    feedback_id: str = Field(..., description="피드백 고유 식별자")
    user_session_id: str = Field(..., description="매칭되는 사용자의 분석 세션 ID")
    thinking_structure: ThinkingStructureType = Field(..., description="분류된 사용자의 사고 흐름 방식")
    logic_evaluation: LogicEvaluation = Field(..., description="논리성 및 정확성 평가 결과")
    grammar_evaluation: GrammarEvaluation = Field(..., description="오타 및 문법 교정 결과")
    translated_expert_sentence: str = Field(..., description="전문가 수준의 용어로 번역된 최종 분석 문장")
    educational_feedback: str = Field(..., description="사용자의 학습을 돕기 위해 제공되는 칭찬 및 보완 지점 안내")
