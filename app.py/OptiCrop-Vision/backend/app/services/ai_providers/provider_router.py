import os
from . import gemini_provider
from . import huggingface_provider
from . import groq_provider
from . import openrouter_provider
from . import nvidia_provider

def run_vision_chain(file_path: str, prompt: str, language: str) -> tuple[dict, str, str]:
    """
    Executes the vision provider chain: Gemini
    Returns (diagnosis_data, source_badge_label, model_used)
    """
    # 1. Try Gemini Chain
    gemini_chain_env = os.getenv("GEMINI_MODEL_CHAIN", "gemini-2.5-flash-lite,gemini-2.0-flash,gemini-2.5-pro")
    gemini_chain = [m.strip() for m in gemini_chain_env.split(",") if m.strip()]
    if not gemini_chain:
        gemini_chain = ["gemini-2.5-flash"]
        
    data, model_used = gemini_provider.analyze_image(file_path, prompt, gemini_chain)
    if data:
        return data, "gemini", model_used
        
    # All vision providers (Gemini keys/models) failed
    return None, None, None

def run_text_chain(prompt: str, system_instruction: str = None) -> tuple[str, str]:
    """
    Executes the text assistant provider chain: Gemini Only
    Returns (response_text, source)
    """
    # Try Gemini
    gemini_chain_env = os.getenv("GEMINI_MODEL_CHAIN", "gemini-2.5-flash-lite,gemini-2.0-flash,gemini-2.5-pro")
    gemini_chain = [m.strip() for m in gemini_chain_env.split(",") if m.strip()]
    if not gemini_chain:
        gemini_chain = ["gemini-2.5-flash"]
        
        
    response, model = gemini_provider.chat(prompt, gemini_chain, system_instruction)
    if response:
        return response, "gemini"
        
    return None, None
