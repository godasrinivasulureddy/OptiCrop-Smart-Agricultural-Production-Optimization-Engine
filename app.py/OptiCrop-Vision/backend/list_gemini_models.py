import os
from google import genai
from dotenv import load_dotenv

def list_gemini_models():
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("No GEMINI_API_KEY found.")
        return
        
    client = genai.Client(api_key=api_key)
    
    print("Available Gemini Models (google.genai):")
    try:
        models = client.models.list()
        for m in models:
            print(f" - {m.name}")
    except Exception as e:
        print(f"Error listing models: {e}")

if __name__ == "__main__":
    list_gemini_models()
