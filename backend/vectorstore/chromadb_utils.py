from typing import List
import os
import chromadb
from sentence_transformers import SentenceTransformer

# Use a fixed collection name
COLLECTION_NAME = "pdf_collection"

# Initialize Chroma persistent client relative to backend folder
CHROMA_PATH = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "chroma_store"))
client = chromadb.PersistentClient(path=CHROMA_PATH)

# Load embedding model
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")

def get_collection():
    return client.get_or_create_collection(name=COLLECTION_NAME)

def store_embeddings(text: str) -> None:
    # CLEAR THE COLLECTION BEFORE STORING NEW EMBEDDINGS
    try:
        client.delete_collection(name=COLLECTION_NAME)
        print(f"Cleared existing collection: {COLLECTION_NAME}")
    except Exception as e:
        print(f"Collection didn't exist or couldn't be deleted: {e}")
    
    # Create fresh collection
    collection = client.create_collection(name=COLLECTION_NAME)
    
    chunks = [text[i:i+500] for i in range(0, len(text), 500) if text[i:i+500].strip()]
    embedding_tuples = []

    for i, chunk in enumerate(chunks):
        embedding = embedding_model.encode(chunk).tolist()
        embedding_tuples.append((embedding, chunk, f"chunk_{i}"))

    if embedding_tuples:
        embeddings, documents, ids = zip(*embedding_tuples)
        collection.add(
            embeddings=list(embeddings),
            documents=list(documents),
            ids=list(ids)
        )
        print(f"Stored {len(embedding_tuples)} chunks in {COLLECTION_NAME}")
    else:
        print("No text chunks were embedded.")

def query_chroma(query_text: str, top_k: int = 3) -> List[str]:
    try:
        collection = get_collection()
        count = collection.count()
        if count == 0:
            return []
        
        query_embedding = embedding_model.encode(query_text).tolist()
        actual_k = min(top_k, count)
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=actual_k
        )
        if results and "documents" in results and results["documents"]:
            return results["documents"][0]
        return []
    except Exception as e:
        print(f"Error querying Chroma: {e}")
        return []
