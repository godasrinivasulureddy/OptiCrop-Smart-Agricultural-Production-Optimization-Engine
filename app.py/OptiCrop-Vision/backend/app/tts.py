import os
import io
import requests
import base64
import re
import wave
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from .auth import get_current_user
from .models import User

load_dotenv()

router = APIRouter(prefix="/api/tts", tags=["Text to Speech"])

TTS_PROVIDER = os.getenv("TTS_PROVIDER", "browser").strip().lower()
OMNIDIMENSION_API_KEY = os.getenv("OMNIDIMENSION_API_KEY", "").strip()
SARVAM_API_KEY = os.getenv("SARVAM_API_KEY", "").strip()

SARVAM_TELUGU_SPEAKER = os.getenv("SARVAM_TELUGU_SPEAKER", "anushka").strip()
SARVAM_ENGLISH_SPEAKER = os.getenv("SARVAM_ENGLISH_SPEAKER", "shubh").strip()

print(f"TTS Provider configured: {TTS_PROVIDER}")
print(f"OmniDimension key loaded: {bool(OMNIDIMENSION_API_KEY)}")
print(f"Sarvam API key loaded: {bool(SARVAM_API_KEY)}")

class TTSRequest(BaseModel):
    text: str
    language: str

def normalize_text(text: str, lang: str) -> str:
    # Remove markdown formatting (*, #, _, >, etc.) and brackets
    text = re.sub(r'[*#_>\[\]\(\)]', '', text)
    # Remove URLs
    text = re.sub(r'http\S+', '', text)
    # Remove extra spaces
    text = re.sub(r'\s+', ' ', text)
    
    if lang.lower() == "telugu":
        text = text.replace("NPK", "ఎన్ పీ కె")
        text = text.replace("pH", "పీ హెచ్")
        text = text.replace("N ", "నత్రజని ")
        text = text.replace("P ", "భాస్వరం ")
        text = text.replace("K ", "పొటాషియం ")
        
    return text.strip()

def chunk_text(text: str, max_length: int = 400):
    # Split by Telugu period (।), standard period, exclamation, or question mark
    sentences = re.split(r'(?<=[.!?।])\s+', text)
    chunks = []
    current_chunk = ""
    for s in sentences:
        if len(current_chunk) + len(s) < max_length:
            current_chunk += " " + s
        else:
            if current_chunk.strip():
                chunks.append(current_chunk.strip())
            current_chunk = s
    if current_chunk.strip():
        chunks.append(current_chunk.strip())
    return [c for c in chunks if c.strip()]

def merge_wav_bytes(wav_bytes_list):
    if not wav_bytes_list:
        return b""
    if len(wav_bytes_list) == 1:
        return wav_bytes_list[0]
        
    data = []
    params = None
    for wav_bytes in wav_bytes_list:
        try:
            with wave.open(io.BytesIO(wav_bytes), 'rb') as w:
                if params is None:
                    params = w.getparams()
                data.append(w.readframes(w.getnframes()))
        except Exception as e:
            print(f"Error reading WAV chunk: {e}")
            continue
            
    if not data:
        return b""
        
    out_io = io.BytesIO()
    with wave.open(out_io, 'wb') as w_out:
        w_out.setparams(params)
        for d in data:
            w_out.writeframes(d)
    return out_io.getvalue()

@router.post("/speak")
async def speak_text(request: TTSRequest, current_user: User = Depends(get_current_user)):
    provider = TTS_PROVIDER
    
    if provider == "omnidimension":
        print("OmniDimension does not expose a raw TTS REST endpoint in the public documentation. Falling back to browser.")
        return JSONResponse(content={"fallback": True, "reason": "Server TTS provider unavailable"})
        
    elif provider == "sarvam":
        if not SARVAM_API_KEY:
            print("Sarvam API key missing, triggering fallback.")
            return JSONResponse(content={"fallback": True, "reason": "Server TTS provider unavailable"})
            
        try:
            is_telugu = request.language.lower() == "telugu"
            target_lang = "te-IN" if is_telugu else "en-IN"
            speaker = SARVAM_TELUGU_SPEAKER if is_telugu else SARVAM_ENGLISH_SPEAKER
            default_speaker = "anushka" if is_telugu else "shubh"
            
            clean_text = normalize_text(request.text, request.language)
            chunks = chunk_text(clean_text)
            
            url = "https://api.sarvam.ai/text-to-speech"
            headers = {
                "api-subscription-key": SARVAM_API_KEY,
                "Content-Type": "application/json"
            }
            
            audio_chunks = []
            
            for chunk in chunks:
                if not chunk: continue
                
                def make_payload(spkr):
                    return {
                        "inputs": [chunk],
                        "target_language_code": target_lang,
                        "speaker": spkr,
                        "pitch": 0,
                        "pace": 1.05,
                        "loudness": 1.5,
                        "speech_sample_rate": 16000,
                        "enable_preprocessing": True,
                        "model": os.getenv("SARVAM_MODEL", "bulbul:v2").strip()
                    }
                
                res = requests.post(url, json=make_payload(speaker), headers=headers, timeout=12)
                
                # Retry logic if speaker is invalid
                if res.status_code == 400 and "Speaker" in res.text and speaker != default_speaker:
                    print(f"Configured speaker '{speaker}' failed, retrying with default '{default_speaker}'...")
                    res = requests.post(url, json=make_payload(default_speaker), headers=headers, timeout=12)
                
                if res.ok:
                    data = res.json()
                    if "audios" in data and len(data["audios"]) > 0:
                        audio_chunks.append(base64.b64decode(data["audios"][0]))
                    else:
                        print(f"Sarvam AI returned success but no audio data for chunk: {chunk[:50]}")
                else:
                    print(f"Sarvam AI API failed on chunk: {res.status_code} - {res.text}")
                    if not audio_chunks:
                        return JSONResponse(content={"fallback": True, "reason": "Server TTS provider unavailable"})
            
            if audio_chunks:
                merged_audio = merge_wav_bytes(audio_chunks)
                return StreamingResponse(io.BytesIO(merged_audio), media_type="audio/wav")
            else:
                return JSONResponse(content={"fallback": True, "reason": "Server TTS provider failed to return audio"})
                
        except Exception as e:
            print(f"Sarvam TTS Integration Error: {e}")
            return JSONResponse(content={"fallback": True, "reason": "Server TTS provider unavailable"})
            
    # Default fallback
    print("No valid server TTS provider found. Falling back to browser.")
    return JSONResponse(content={"fallback": True, "reason": "Server TTS provider unavailable"})
