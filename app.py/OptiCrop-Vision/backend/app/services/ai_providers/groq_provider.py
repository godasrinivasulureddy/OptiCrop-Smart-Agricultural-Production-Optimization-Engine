import os
import httpx

def chat(prompt: str, model: str, system_instruction: str = None) -> tuple[str, str]:
    """
    Attempts to run a chat completion using Groq.
    Returns (response_text, used_model) or (None, None) if fails.
    """
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key:
        return None, None
        
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": model,
        "messages": messages,
        "temperature": 0.7,
        "max_tokens": 1024
    }
    
    print(f"Attempting Groq chat with model: {model}")
    try:
        response = httpx.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers=headers,
            json=payload,
            timeout=15.0
        )
        
        if response.status_code == 200:
            data = response.json()
            response_text = data["choices"][0]["message"]["content"].strip()
            print(f"Success Groq model: {model}")
            return response_text, model
        else:
            error_msg = response.text.lower()
            if response.status_code == 429 or "quota" in error_msg:
                print(f"Quota error on Groq {model}: {response.status_code}")
            elif response.status_code in [401, 403]:
                print(f"Auth error on Groq {model}: {response.status_code}")
            else:
                print(f"Groq API Error {response.status_code}: {response.text}")
    except Exception as e:
        print(f"Groq Request Failed: {e}")
        
    return None, None
