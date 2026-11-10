from typing import List, Tuple
from sentence_transformers import SentenceTransformer

# Load your embedding model
model = SentenceTransformer("all-MiniLM-L6-v2")

def split_text(text: str, max_length: int = 500) -> List[str]:
    paragraphs = text.split("\n")
    chunks = []
    current_chunk = ""
    for para in paragraphs:
        if len(current_chunk) + len(para) <= max_length:
            current_chunk += para + "\n"
        else:
            chunks.append(current_chunk.strip())
            current_chunk = para + "\n"
    if current_chunk:
        chunks.append(current_chunk.strip())
    return chunks

def embed_text_chunks(text: str, chunk_size: int = 500) -> List[Tuple[List[float], str]]:
    chunks = split_text(text, chunk_size)
    embedding_tuples = []
    for chunk in chunks:
        if chunk.strip():  # skip empty chunks
            response = model.encode(chunk)
            embedding_tuples.append((response.tolist(), chunk))
    print("Chunks embedded:", len(embedding_tuples))  # Debug print
    return embedding_tuples

