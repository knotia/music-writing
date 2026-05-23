import os
import uuid
from dotenv import load_dotenv
from google import genai
from google.genai import types

# 상위 폴더 경로 인식을 위해 schemas를 직접 임포트 가능하게 구성
from src.schemas.user_analysis import UserAnalysisRequest
from src.schemas.feedback import ExpertFeedback

# .env 로드
load_dotenv()

# Gemini 클라이언트 초기화
api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key and api_key != "your_gemini_api_key_here" else None

# 시스템 프롬프트 읽어오기
prompt_path = os.path.join(os.path.dirname(__file__), "../../templates/system_prompt.md")
try:
    with open(prompt_path, "r", encoding="utf-8") as f:
        SYSTEM_PROMPT = f.read()
except FileNotFoundError:
    SYSTEM_PROMPT = "당신은 음악 이론 전문가입니다."

def get_musical_analysis_feedback(request_data: UserAnalysisRequest) -> ExpertFeedback:
    """
    Google Gemini API의 Structured Output 기능을 사용하여 
    입력된 문장을 ExpertFeedback 스키마에 맞게 분석하여 반환합니다.
    """
    if not client:
        raise ValueError("GEMINI_API_KEY 환경 변수가 설정되지 않았습니다. .env 파일을 확인하세요.")

    # 프롬프트 조립
    user_message = ""
    
    # 이전 대화 기록이 있다면 추가
    if request_data.history:
        user_message += "--- [이전 대화 맥락] ---\n"
        for msg in request_data.history:
            role = "학생" if msg.get("role") == "user" else "AI 튜터"
            user_message += f"{role}: {msg.get('content')}\n"
        user_message += "----------------------\n\n"
        
    user_message += f"이번에 학생이 새로 입력한 답변/문장: {request_data.raw_sentence}\n\n"
    
    if request_data.extracted_elements:
        user_message += f"1차 추출 요소 참고: {request_data.extracted_elements.model_dump_json()}\n"
    
    user_message += "\n위 대화 맥락과 새로운 문장을 종합적으로 분석하고, 항목별 점수 평가, 작문 첨삭, 꼬리 질문 등을 생성해주세요."

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=user_message,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ExpertFeedback,
            system_instruction=SYSTEM_PROMPT,
            temperature=0.7,
        ),
    )
    
    # 파싱된 Pydantic 모델 인스턴스 반환
    feedback: ExpertFeedback = response.parsed
    
    # 식별자들은 서버에서 통제하는 것이 좋으므로 덮어씌움
    feedback.feedback_id = f"fb_{uuid.uuid4().hex[:8]}"
    feedback.user_session_id = request_data.session_id
    
    return feedback
