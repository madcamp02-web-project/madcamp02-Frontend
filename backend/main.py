from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from google import genai
from dotenv import load_dotenv
from typing import List, Optional

load_dotenv()

app = FastAPI()

# CORS 설정
origins = [
    "http://madcamp.royaljellynas.org",
    "http://127.0.0.1:3000",
    "http://madcamp.royaljellynas.org",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatRequest(BaseModel):
    message: str


# Gemini API 키 로테이션 설정
# - GEMINI_API_KEYS: "key1,key2,key3" 형태로 쉼표로 구분
# - 없으면 기존 GEMINI_API_KEY 하나만 사용하는 형태로 동작
raw_keys = os.getenv("GEMINI_API_KEYS")
single_key = os.getenv("GEMINI_API_KEY")

GEMINI_API_KEYS: List[str] = []

if raw_keys:
    GEMINI_API_KEYS = [k.strip() for k in raw_keys.split(",") if k.strip()]
elif single_key:
    GEMINI_API_KEYS = [single_key]

current_key_index: int = 0
client: Optional[genai.Client] = None


def _create_client(index: int) -> Optional[genai.Client]:
    """주어진 인덱스의 키로 Gemini 클라이언트 생성 (키 없으면 None)."""
    if not GEMINI_API_KEYS:
        print("⚠️ Gemini API 키가 환경 변수에 설정되어 있지 않습니다.")
        return None

    key = GEMINI_API_KEYS[index % len(GEMINI_API_KEYS)]
    try:
        c = genai.Client(api_key=key)
        print(f"✅ Gemini API configured with key index {index}.")
        return c
    except Exception as e:
        print(f"⚠️ Gemini 클라이언트 초기화 실패 (index={index}): {e}")
        return None


def _rotate_key_and_recreate_client() -> Optional[genai.Client]:
    """다음 키로 인덱스를 이동하고 새 클라이언트를 생성."""
    global current_key_index, client
    if not GEMINI_API_KEYS:
        client = None
        return None

    current_key_index = (current_key_index + 1) % len(GEMINI_API_KEYS)
    client = _create_client(current_key_index)
    return client


# 초기 클라이언트 생성
client = _create_client(current_key_index)


SYSTEM_INSTRUCTION = (
    "당신은 천 년을 산 전설적인 주식 투자 도사입니다. 항상 한국어로만 대답해야 합니다. "
    "말투는 신비롭고 옛스러운 '하게체'를 사용하세요. (예: '허허, 자네 왔는가?', '내 말을 명심하게나.') "
    "절대 존댓말이나 영어를 쓰지 마세요. 투자 조언은 진지하게 하되, 유머러스한 도사 컨셉을 유지하세요. "
    "답변은 너무 길지 않게 3~4문장 이내로 핵심만 간결하게 말하세요."
)


@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "model": "gemini-flash-lite-latest",
        "api_key_configured": bool(GEMINI_API_KEYS),
        "key_count": len(GEMINI_API_KEYS),
        "current_key_index": current_key_index if GEMINI_API_KEYS else None,
    }


def _is_retriable_key_error(error_msg: str) -> bool:
    """현재 키를 교체할 만한 에러인지 판별."""
    msg = error_msg.upper()
    # API 키 자체가 잘못되었거나, 쿼터/요청 한도 초과, 권한 문제 등
    retriable_markers = [
        "API_KEY_INVALID",
        "PERMISSION_DENIED",
        "RESOURCE_EXHAUSTED",
        "429",
        "QUOTA",
    ]
    return any(marker in msg for marker in retriable_markers)


@app.post("/chat")
async def chat(request: ChatRequest):
    global client

    if not GEMINI_API_KEYS:
        raise HTTPException(status_code=503, detail="Gemini API Key가 설정되어 있지 않습니다.")

    # 현재 키부터 최대 전체 키 개수만큼 시도
    attempts = len(GEMINI_API_KEYS)

    last_error_msg = None

    for _ in range(attempts):
        if not client:
            client = _create_client(current_key_index)
            if not client:
                last_error_msg = "Gemini 클라이언트 초기화에 실패했습니다."
                _rotate_key_and_recreate_client()
                continue

        try:
            response = client.models.generate_content(
                model="gemini-flash-lite-latest",
                contents=request.message,
                config={
                    "system_instruction": SYSTEM_INSTRUCTION,
                },
            )
            return {"response": response.text}

        except Exception as e:
            print(f"Error with key index {current_key_index}: {e}")
            error_msg = str(e)
            last_error_msg = error_msg

            # 키 문제로 판단되면 다음 키로 로테이션 후 재시도
            if _is_retriable_key_error(error_msg):
                _rotate_key_and_recreate_client()
                continue

            # 키 이슈가 아니면 바로 에러 반환
            if "API_KEY_INVALID" in error_msg:
                user_msg = "API Key가 유효하지 않습니다."
            elif "429" in error_msg:
                user_msg = "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
            else:
                user_msg = error_msg

            raise HTTPException(status_code=500, detail=user_msg)

    # 모든 키를 시도했지만 실패한 경우
    if last_error_msg:
        if "API_KEY_INVALID" in last_error_msg:
            last_error_msg = "모든 API Key가 유효하지 않습니다."
        elif "429" in last_error_msg or "QUOTA" in last_error_msg.upper():
            last_error_msg = "모든 API Key에서 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."

    raise HTTPException(status_code=503, detail=last_error_msg or "모든 Gemini API Key 사용에 실패했습니다.")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)