import os
import json
from google import genai
from PIL import Image

_VALID_GEMINI_MODELS = None

def get_valid_models(api_key: str):
    global _VALID_GEMINI_MODELS
    if _VALID_GEMINI_MODELS is None:
        try:
            client = genai.Client(api_key=api_key)
            models = client.models.list()
            _VALID_GEMINI_MODELS = set([m.name.replace("models/", "") for m in models])
        except Exception as e:
            print(f"Failed to fetch valid Gemini models: {e}")
            _VALID_GEMINI_MODELS = set()
    return _VALID_GEMINI_MODELS

def analyze_image(file_path: str, prompt: str, model_chain: list) -> tuple[dict, str]:
    """
    Attempts to analyze an image using Gemini API keys and model chain.
    Returns (diagnosis_data, used_model) or (None, None) if all fail.
    """
    keys_env = os.getenv("GEMINI_API_KEYS", "").strip()
    if not keys_env:
        keys_env = os.getenv("GEMINI_API_KEY", "").strip()
        
    api_keys = [k.strip() for k in keys_env.split(",") if k.strip()]
    if not api_keys:
        return None, None
        
    try:
        pil_image = Image.open(file_path)
    except Exception as e:
        print(f"Error opening image {file_path}: {e}")
        return None, None

    for i, api_key in enumerate(api_keys, 1):
        valid_models = get_valid_models(api_key)
        client = genai.Client(api_key=api_key)
        
        for model_name in model_chain:
            if valid_models and model_name not in valid_models:
                continue
                
            try:
                print(f"Trying Gemini key #{i} with {model_name}")
                response = client.models.generate_content(
                    model=model_name,
                    contents=[prompt, pil_image]
                )
                text = response.text.strip()
                
                if text.startswith("```json"):
                    text = text.replace("```json", "", 1)
                if text.endswith("```"):
                    text = text[:-3]
                    
                parsed = json.loads(text.strip())
                return parsed, model_name
            except Exception as e:
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str or "exhausted" in error_str:
                    print(f"Quota exceeded on key #{i}, trying next key/model...")
                    break  # Try next key
                elif "401" in error_str or "403" in error_str or "auth" in error_str:
                    print(f"Auth error: Invalid key on key #{i}, skipping this key.")
                    break  # Try next key
                else:
                    print(f"Error on key #{i} with {model_name}: {e}. Trying next...")
                    
    return None, None

def chat(prompt: str, model_chain: list, system_instruction: str = None) -> tuple[str, str]:
    """
    Attempts to run a chat completion using Gemini model chain and API keys.
    Returns (response_text, used_model) or (None, None) if all fail.
    """
    keys_env = os.getenv("GEMINI_API_KEYS", "").strip()
    if not keys_env:
        keys_env = os.getenv("GEMINI_API_KEY", "").strip()
        
    api_keys = [k.strip() for k in keys_env.split(",") if k.strip()]
    if not api_keys:
        return None, None
        
    for i, api_key in enumerate(api_keys, 1):
        valid_models = get_valid_models(api_key)
        client = genai.Client(api_key=api_key)
        
        for model_name in model_chain:
            if valid_models and model_name not in valid_models:
                continue
                
            try:
                print(f"Trying Gemini key #{i} with {model_name}")
                config = {}
                if system_instruction:
                    config["system_instruction"] = system_instruction
                    
                response = client.models.generate_content(
                    model=model_name,
                    contents=prompt,
                    config=config if config else None
                )
                response_text = response.text.strip()
                return response_text, model_name
            except Exception as e:
                error_str = str(e).lower()
                if "429" in error_str or "quota" in error_str or "exhausted" in error_str:
                    print(f"Quota exceeded on key #{i}, trying next key/model...")
                    break  # Try next key
                elif "401" in error_str or "403" in error_str or "auth" in error_str:
                    print(f"Auth error: Invalid key on key #{i}, skipping this key.")
                    break  # Try next key
                else:
                    print(f"Error on key #{i} with {model_name}: {e}. Trying next...")
                    
    return None, None
