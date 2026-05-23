from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os
from dotenv import load_dotenv

load_dotenv()

# 환경 변수가 없으면 로컬 SQLite 사용
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./music_writing.db")

# SQLAlchemy 1.4+ 에서는 postgres:// 대신 postgresql:// 을 사용해야 함 (Render 기본 제공 URL 대응)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# SQLite를 사용할 경우 check_same_thread=False 설정이 필요합니다.
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
