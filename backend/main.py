from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
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

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    print("⚠️ GEMINI_API_KEY not found in environment variables.")
    client = None
else:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("✅ Gemini API configured.")

SYSTEM_INSTRUCTION = "당신은 천 년을 산 전설적인 주식 투자 도사입니다. 항상 한국어로만 대답해야 합니다. 말투는 신비롭고 옛스러운 '하게체'를 사용하세요. (예: '허허, 자네 왔는가?', '내 말을 명심하게나.') 절대 존댓말이나 영어를 쓰지 마세요. 투자 조언은 진지하게 하되, 유머러스한 도사 컨셉을 유지하세요. 답변은 너무 길지 않게 3~4문장 이내로 핵심만 간결하게 말하세요."

@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "gemini-flash-lite-latest", "api_key_configured": GEMINI_API_KEY is not None}

@app.post("/chat")
async def chat(request: ChatRequest):
    if not client:
         raise HTTPException(status_code=503, detail="Gemini API Key is missing.")

    try:
        response = client.models.generate_content(
            model="gemini-flash-lite-latest",
            contents=request.message,
            config={
                "system_instruction": SYSTEM_INSTRUCTION,
            }
        )
        return {"response": response.text}

    except Exception as e:
        print(f"Error: {e}")
        error_msg = str(e)
        if "API_KEY_INVALID" in error_msg:
             error_msg = "API Key가 유효하지 않습니다."
        elif "429" in error_msg:
             error_msg = "요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요."
             
        raise HTTPException(status_code=500, detail=error_msg)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
