from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from src.api.routes import health, analyze, auth, progress, teacher
from src.api.database import engine, Base

# 앱 시작 시 DB 테이블 생성 (이미 있으면 패스됨)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Musical Thought Translation API (Full-Stack)",
    description="음악적 사고를 자연어로 이해하고 전문가 수준으로 번역하며, 학생의 글쓰기 발전을 추적하는 AI API 서버",
    version="2.0.0"
)

# CORS 설정 (프론트엔드 연동을 위해 개방)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(analyze.router, prefix="/api/v1")
app.include_router(progress.router, prefix="/api/v1")
app.include_router(teacher.router, prefix="/api/v1")

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Welcome to the Full-Stack Musical Thought Translation API",
        "docs": "/docs"
    }
