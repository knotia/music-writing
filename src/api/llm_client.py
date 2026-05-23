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
        user_message += "--- [이전 대화 맥락 (참고용)] ---\n"
        for msg in request_data.history:
            role = "학생" if msg.get("role") == "user" else "AI 튜터"
            user_message += f"{role}: {msg.get('content')}\n"
        user_message += "----------------------\n\n"
        
    user_message += f"학생이 현재까지 작성한 전체 글(원문+추가된 답변): {request_data.raw_sentence}\n\n"
    
    if request_data.extracted_elements:
        user_message += f"1차 추출 요소 참고: {request_data.extracted_elements.model_dump_json()}\n"
    
    user_message += "\n위 대화 맥락을 참고하되, 반드시 '현재까지 작성한 전체 글' 전체를 대상으로 분석하여 종합 평가 점수, 전체 글에 대한 작문 첨삭 원문, 그리고 다음 단계로 나아갈 새로운 꼬리 질문을 생성해주세요."

    response = client.models.generate_content_stream(
        model='gemini-2.5-pro',
        contents=user_message,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.7,
        ),
    )
    
    for chunk in response:
        yield chunk.text
