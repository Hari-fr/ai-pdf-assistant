from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from pdf_utils.integrated_processor import extract_comprehensive_content, extract_text_and_simple_tables, extract_only_text
from vectorstore.chromadb_utils import query_chroma, store_embeddings
from llm.phi_client import query_llm
from pydantic import BaseModel

app = FastAPI(title="PDF Query System")

# CORS setup (adjust origins as needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "temp"))
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Optional: Add your Hugging Face token via environment variable for advanced table extraction
HF_TOKEN = os.getenv("HF_TOKEN", "")

# Choose extraction mode:
# "text_only" - only text extraction
# "text_and_simple_tables" - text + pdfplumber tables (Fast & Local)
# "comprehensive" - text + simple tables + advanced table extraction (requires internet & HF_TOKEN)
EXTRACTION_MODE = "text_and_simple_tables"

class QueryRequest(BaseModel):
    question: str

@app.post("/upload-pdf/")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Extract content based on mode
    if EXTRACTION_MODE == "comprehensive" and HF_TOKEN:
        extracted_content = extract_comprehensive_content(file_path, HF_TOKEN)
    elif EXTRACTION_MODE == "text_and_simple_tables":
        extracted_content = extract_text_and_simple_tables(file_path)
    else:  # text_only
        extracted_content = extract_only_text(file_path)

    # Store in vector DB
    store_embeddings(extracted_content)

    # Clean up uploaded file
    if os.path.exists(file_path):
        os.remove(file_path)

    return {
        "filename": file.filename, 
        "extraction_mode": EXTRACTION_MODE,
        "preview": extracted_content[:1000]
    }

@app.post("/ask")
async def ask_question(request: QueryRequest):
    relevant_chunks = query_chroma(request.question)
    context = "\n".join(relevant_chunks)
    answer = query_llm(request.question, context)
    print("Full LLM Response:", answer)
    return {"answer": answer}

@app.get("/status")
async def get_status():
    return {
        "extraction_mode": EXTRACTION_MODE,
        "advanced_tables_enabled": bool(HF_TOKEN),
        "message": "PDF Query System is running"
    }
