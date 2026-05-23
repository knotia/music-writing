from fastapi import APIRouter

router = APIRouter()

@router.get("/health", tags=["System"])
async def health_check():
    """
    서버의 정상 구동 상태를 확인하는 핑(Ping) 엔드포인트
    """
    return {"status": "ok", "message": "Antigravity Music Analysis API is running."}
