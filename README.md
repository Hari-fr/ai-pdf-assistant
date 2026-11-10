# AI PDF Assistant (RAG Document Query System)

An intelligent, local Retrieval-Augmented Generation (RAG) system that allows users to upload PDF documents, extract text and complex tables, index content into a vector database, and chat interactively using local Large Language Models (LLMs).

---

## 🚀 Key Features

- **Document Parsing**: Extracts clean text and structured tables from PDFs using `pdfplumber` and `pdf2image`.
- **Vector Database**: Efficient in-memory & persistent chunk retrieval using **ChromaDB**.
- **Dense Embeddings**: Employs `all-MiniLM-L6-v2` (`SentenceTransformer`) for fast, semantic document search.
- **Local Private LLM**: Powered by **Ollama** running lightweight, high-performance models (e.g. `llama3.2:1b` or `qwen2.5:1.5b`) — zero cloud data leaks.
- **Modern Dark UI**: React, TypeScript, and Tailwind CSS interface with glassmorphic cards, animated thinking indicators, quick-prompt chips, and one-click copy.

---

## 🛠️ Tech Stack

- **Backend**: FastAPI, Uvicorn, Pydantic, Python
- **Vector Store**: ChromaDB
- **Embeddings**: SentenceTransformers (`all-MiniLM-L6-v2`)
- **LLM Engine**: Ollama (`llama3.2:1b`)
- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons

---

## 📋 Prerequisites

1. **Python 3.11+** installed
2. **Node.js 18+** & npm installed
3. **Ollama** installed ([Download Ollama](https://ollama.com/download))

---

## ⚡ Quick Start

### 1. Setup Ollama (LLM)
Pull the lightweight model (requires ~1.8 GB RAM):
```bash
ollama pull llama3.2:1b
```
Ensure Ollama is running in the background.

---

### 2. Backend Setup

```bash
# Navigate to project root
cd "Pdf query system"

# Create and activate virtual environment
python -m venv pdf_env
# On Windows:
.\pdf_env\Scripts\activate
# On Linux/macOS:
source pdf_env/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run the FastAPI server
cd backend
uvicorn main:app --reload
```
The API documentation will be available at: `http://localhost:8000/docs`

---

### 3. Frontend Setup

In a separate terminal:
```bash
cd "Pdf query system/frontend"

# Install node packages (if not already installed)
npm install

# Start the Vite development server
npm run dev
# (On Windows PowerShell if execution policies apply, use: npm.cmd run dev)
```
Open **`http://localhost:5173`** in your browser.

---

## 📂 Project Structure

```
├── backend/
│   ├── llm/
│   │   └── phi_client.py         # Ollama LLM integration
│   ├── pdf_utils/
│   │   ├── image_converter.py    # Converts PDF pages to images
│   │   ├── integrated_processor.py
│   │   ├── table_extractor.py
│   │   └── text_extractor.py     # pdfplumber text extraction
│   ├── vectorstore/
│   │   └── chromadb_utils.py     # ChromaDB embedding & retrieval
│   ├── main.py                   # FastAPI application & endpoints
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.tsx               # Main React interface
│   │   ├── index.css             # Glassmorphism & custom styling
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── PDF samples/                  # Sample PDF files for testing
├── .gitignore
└── README.md
```

---

## 🔒 Privacy & Local Execution
All document embeddings, database records, and LLM inferences run **100% locally** on your machine. No documents or queries are sent to external third-party cloud servers.

