import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
try:
    from google import genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

from .database import get_db
from .models import User, ChatLog
from .schemas import ChatRequest, ChatResponse
from .auth import get_current_user

router = APIRouter(prefix="/api/assistant", tags=["AI Assistant"])

# Configure Gemini
raw_api_key = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_KEY = raw_api_key.strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip()

SYSTEM_PROMPT = """
You are the OptiCrop Multilingual Farmer AI Assistant.
Your primary languages are English, Telugu, and Hindi. Respond in the language requested by the user.
You MUST restrict your domain to agriculture ONLY. Allowed topics include:
crops, diseases, fertilizer, irrigation, soil, pests, weather, and farming practices.

If a user asks about an unrelated topic (e.g. politics, celebrities, movies, non-agriculture tech), you MUST firmly but politely reject it.
Example rejection: "This assistant only supports agriculture-related guidance."

Every answer you provide must maintain a scientific advisory tone.
You MUST NEVER:
1. Guarantee yield claims.
2. Provide exact disease certainty without field/lab verification.
3. Provide exact future market prices.

ALWAYS end your responses with this disclaimer (translated to the user's language):
"AI guidance is advisory only. Please verify with a local agriculture expert for serious cases."
"""

FAQ_FALLBACKS = {
    "english": "I am currently in fallback mode. I can tell you that for general crop health, ensure adequate watering and balanced NPK fertilizers. If you see yellow leaves, it might be a nitrogen deficiency. AI guidance is advisory only. Please verify with a local agriculture expert.",
    "telugu": "నేను ప్రస్తుతం ఫాల్‌బ్యాక్ మోడ్‌లో ఉన్నాను. సాధారణ పంట ఆరోగ్యానికి, తగినంత నీరు మరియు NPK ఎరువులు ఉండేలా చూసుకోండి. ఆకులు పసుపు రంగులో ఉంటే, అది నత్రజని లోపం కావచ్చు. AI సలహా కేవలం సూచన కోసం మాత్రమే. దయచేసి స్థానిక వ్యవసాయ నిపుణుడిని సంప్రదించండి.",
    "hindi": "मैं अभी फॉलबैक मोड में हूँ। सामान्य फसल स्वास्थ्य के लिए, उचित पानी और NPK उर्वरक सुनिश्चित करें। यदि पत्तियां पीली हैं, तो यह नाइट्रोजन की कमी हो सकती है। AI मार्गदर्शन केवल सलाह है। कृपया स्थानीय कृषि विशेषज्ञ से संपर्क करें।"
}

from .services.ai_providers import provider_router

@router.post("/chat", response_model=ChatResponse)
async def chat_assistant(request: ChatRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    user_lang = request.language.lower()
    
    SYSTEM_PROMPT = f"""
    You are an expert AI Agricultural Assistant for OptiCrop. 
    The user is a farmer seeking advice.
    Respond entirely in {'Telugu' if user_lang == 'telugu' else 'English'}.
    Be concise, practical, and focus on sustainable and natural farming methods.
    """
    
    response_text, source = provider_router.run_text_chain(
        prompt=f"User Request (Language: {user_lang}): {request.message}",
        system_instruction=SYSTEM_PROMPT
    )
    
    if not response_text:
        print("All AI models in the text chain failed.")
        response_text = FAQ_FALLBACKS.get(user_lang, FAQ_FALLBACKS["english"])
        source = "fallback"

    chat_log = ChatLog(
        user_id=current_user.id,
        user_message=request.message,
        assistant_response=response_text,
        language=user_lang,
        source=source
    )
    db.add(chat_log)
    db.commit()

    return ChatResponse(
        response=response_text,
        language=user_lang,
        source=source
    )
