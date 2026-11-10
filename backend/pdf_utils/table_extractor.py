import requests
import base64
from PIL import Image
import io

def encode_image_to_base64(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")

def extract_table_from_image(image_path, hf_token: str, model_name="microsoft/table-transformer-detection"):
    try:
        base64_image = encode_image_to_base64(image_path)
        headers = {
            "Authorization": f"Bearer {hf_token}"
        }
        payload = {
            "inputs": base64_image
        }

        api_url = f"https://api-inference.huggingface.co/models/{model_name}"
        response = requests.post(api_url, headers=headers, json=payload, timeout=20)

        if response.status_code == 200:
            return response.json()
        else:
            return {"error": response.text}
    except Exception as e:
        return {"error": str(e)}
