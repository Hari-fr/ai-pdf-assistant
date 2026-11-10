import os
import requests

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2:1b")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://localhost:11434")

def query_llm(question: str, context: str) -> str:
    prompt = f"Context:\n{context}\n\nQuestion:\n{question}\n\nAnswer:"
    model_name = os.getenv("OLLAMA_MODEL", OLLAMA_MODEL)
    
    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": model_name,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "num_ctx": 2048,     # Save RAM
                    "num_predict": 512,  # Save RAM & prevent runaway generation
                    "temperature": 0.7,
                    "top_p": 0.9,
                }
            },
            timeout=120
        )

        if response.status_code == 200:
            try:
                return response.json().get("response", "").strip()
            except (KeyError, TypeError, ValueError):
                return "Unexpected response format from Ollama."
        elif response.status_code == 404:
            return f"Model '{model_name}' not found in Ollama. Please run: ollama pull {model_name}"
        else:
            return f"LLM Error ({response.status_code}): {response.text}"
    except requests.exceptions.ConnectionError:
        return f"Could not connect to Ollama at {OLLAMA_HOST}. Please ensure Ollama is running."
    except requests.exceptions.Timeout:
        return "LLM request timed out. Please try again."
    except Exception as e:
        return f"Error contacting LLM: {str(e)}"
