"""
JartosDTo — Vector Database Service (FAISS + HuggingFace Embeddings).

Lazy-init pattern: heavy ML model loading is deferred to first use,
allowing uvicorn to bind and become healthy immediately on startup.
"""

import os
from typing import Optional

VECTOR_STORE_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "faiss_index")
os.makedirs(VECTOR_STORE_PATH, exist_ok=True)


class VectorDBService:
    """FAISS-backed vector store with lazy initialization."""

    def __init__(self):
        self._embeddings = None
        self._text_splitter = None
        self._vector_store = None
        self._initialized = False
        self.index_path = os.path.join(VECTOR_STORE_PATH, "index")

    def _ensure_initialized(self):
        """Lazy-load heavy ML dependencies on first use."""
        if self._initialized:
            return

        from langchain_community.vectorstores import FAISS
        from langchain_huggingface import HuggingFaceEmbeddings
        from langchain_text_splitters import RecursiveCharacterTextSplitter

        print("🔄 JartosDTo: Loading embedding model (all-MiniLM-L6-v2)...", flush=True)
        self._embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self._text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)

        if os.path.exists(self.index_path):
            self._vector_store = FAISS.load_local(
                self.index_path, self._embeddings,
                allow_dangerous_deserialization=True,
            )
        else:
            self._vector_store = FAISS.from_texts(
                ["JartosDTo Initialize Vector Store"], self._embeddings,
            )
            self._vector_store.save_local(self.index_path)

        self._initialized = True
        print("✅ JartosDTo: Embedding model loaded.", flush=True)

    async def ingest_pdf(self, file_path: str) -> str:
        """Ingests a PDF file and adds its content to the vector database."""
        self._ensure_initialized()
        from langchain_community.document_loaders import PyPDFLoader

        loader = PyPDFLoader(file_path)
        pages = loader.load()
        docs = self._text_splitter.split_documents(pages)

        self._vector_store.add_documents(docs)
        self._vector_store.save_local(self.index_path)

        return f"Ingestados {len(docs)} fragmentos del documento."

    async def retrieve_context(self, query: str, top_k: int = 3) -> str:
        """Retrieves top_k most similar chunks for a given query."""
        self._ensure_initialized()
        docs = self._vector_store.similarity_search(query, k=top_k)

        if not docs:
            return ""

        context = "\n\n---\n\n".join([doc.page_content for doc in docs])
        return context


vector_db = VectorDBService()
