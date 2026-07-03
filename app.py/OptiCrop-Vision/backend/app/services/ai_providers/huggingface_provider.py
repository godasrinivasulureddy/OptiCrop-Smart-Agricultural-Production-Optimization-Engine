import os
import httpx
import base64
import json

def encode_image(file_path: str):
    with open(file_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

def parse_huggingface_json(text: str, language: str) -> dict:
    # Try strict parse first
    cleaned = text.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned.replace("```json", "", 1)
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    cleaned = cleaned.strip()
    
    try:
        parsed = json.loads(cleaned)
        # Ensure minimum keys exist
        return {
            "plant_type": parsed.get("plant_type", "Unknown"),
            "disease_name": parsed.get("disease_name", "Unknown Issue"),
            "confidence": float(parsed.get("confidence", 0.70)),
            "language": language,
            "health_status": parsed.get("health_status", "Unknown"),
            "farmer_summary": parsed.get("farmer_summary", "Analyzed by HuggingFace."),
            "symptoms_json": json.dumps(parsed.get("visible_symptoms", []) if isinstance(parsed.get("visible_symptoms"), list) else []),
            "natural_remedies_json": json.dumps(parsed.get("natural_remedies", []) if isinstance(parsed.get("natural_remedies"), list) else []),
            "organic_fertilizer_suggestions_json": json.dumps(parsed.get("organic_fertilizer_suggestions", []) if isinstance(parsed.get("organic_fertilizer_suggestions"), list) else []),
            "preventive_care_json": json.dumps(parsed.get("preventive_care", []) if isinstance(parsed.get("preventive_care"), list) else []),
            "is_demo_result": False
        }
    except json.JSONDecodeError:
        # Fallback manual extraction
        print("HuggingFace returned malformed JSON, constructing manual fallback schema.")
        return {
            "plant_type": "Unknown (Parsed)",
            "disease_name": "Potential Issue Detected",
            "confidence": 0.60,
            "language": language,
            "health_status": "Unknown",
            "farmer_summary": text[:500] + "..." if len(text) > 500 else text, # Put the raw text in summary so user sees it
            "symptoms_json": json.dumps([]),
            "natural_remedies_json": json.dumps([]),
            "organic_fertilizer_suggestions_json": json.dumps([]),
            "preventive_care_json": json.dumps([]),
            "is_demo_result": False
        }

def analyze_image(file_path: str, prompt: str, model_chain: list, language: str) -> tuple[dict, str]:
    """
    Attempts to analyze an image using HuggingFace vision model chain.
    Returns (diagnosis_data, used_model) or (None, None) if all fail.
    """
    api_key = os.getenv("HUGGINGFACE_API_KEY", "").strip()
    if not api_key:
        return None, None
        
    try:
        base64_image = encode_image(file_path)
    except Exception as e:
        print(f"Error encoding image for HF {file_path}: {e}")
        return None, None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    for model_name in model_chain:
        # HuggingFace standard chat completion URL
        url = f"https://api-inference.huggingface.co/models/{model_name}/v1/chat/completions"
        
        payload = {
            "model": model_name,
            "messages": [
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url", 
                            "image_url": {"url": f"data:image/jpeg;base64,{base64_image}"}
                        }
                    ]
                }
            ],
            "max_tokens": 800,
            "stream": False
        }
        
        print(f"Attempting HuggingFace vision with model: {model_name}")
        try:
            response = httpx.post(url, headers=headers, json=payload, timeout=45.0)
            
            if response.status_code == 200:
                data = response.json()
                if "choices" in data and len(data["choices"]) > 0:
                    text_out = data["choices"][0]["message"]["content"]
                    parsed = parse_huggingface_json(text_out, language)
                    print(f"Success HuggingFace model: {model_name}")
                    return parsed, model_name
            else:
                error_msg = response.text.lower()
                if response.status_code == 429 or "quota" in error_msg or "rate limit" in error_msg:
                    print(f"Quota/Rate Limit error on HF {model_name}: {response.status_code}")
                elif response.status_code in [401, 403]:
                    print(f"Auth error on HF {model_name}: {response.status_code}, stopping HF chain.")
                    break
                elif response.status_code == 503 and "loading" in error_msg:
                    # Model loading cold start
                    print(f"Model {model_name} is loading (cold start). Trying next...")
                else:
                    print(f"HF API Error {response.status_code}: {response.text}")
        except httpx.ReadTimeout:
            print(f"HF API Timeout on {model_name}")
        except Exception as e:
            error_str = str(e).lower()
            if "11001" in error_str or "getaddrinfo" in error_str or "name or service not known" in error_str:
                print(f"HF DNS Error for {model_name}: {e}")
                # Return the special DNS error badge and stop trying other HF models if DNS is down
                return None, "HuggingFace unavailable — network/DNS issue"
            print(f"HF Request Failed for {model_name}: {e}")
            
    return None, None
