import os
import httpx

def chat(prompt: str, model_chain: list, system_instruction: str = None) -> tuple[str, str]:
    """
    Attempts to run a chat completion using NVIDIA model chain.
    Returns (response_text, used_model) or (None, None) if all fail.
    """
    api_key = os.getenv("NVIDIA_API_KEY", "").strip()
    if not api_key:
        return None, None
        
    messages = []
    if system_instruction:
        messages.append({"role": "system", "content": system_instruction})
    messages.append({"role": "user", "content": prompt})
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    
    for model_name in model_chain:
        payload = {
            "model": model_name,
            "messages": messages,
            "temperature": 0.7,
            "max_tokens": 1024,
            "stream": False
        }
        
        print(f"Attempting NVIDIA chat with model: {model_name}")
        try:
            response = httpx.post(
                "https://integrate.api.nvidia.com/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=20.0
            )
            
            if response.status_code == 200:
                data = response.json()
                response_text = data["choices"][0]["message"]["content"].strip()
                print(f"Success NVIDIA model: {model_name}")
                return response_text, model_name
            else:
                error_msg = response.text.lower()
                if response.status_code == 429 or "quota" in error_msg:
                    print(f"Quota error on NVIDIA {model_name}: {response.status_code}")
                elif response.status_code in [401, 403]:
                    print(f"Auth error on NVIDIA {model_name}: {response.status_code}, stopping NVIDIA chain.")
                    break
                else:
                    print(f"NVIDIA API Error {response.status_code}: {response.text}")
        except Exception as e:
            print(f"NVIDIA Request Failed for {model_name}: {e}")
            
    return None, None
