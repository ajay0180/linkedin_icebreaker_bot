from functools import lru_cache

from config import settings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_qdrant import QdrantVectorStore


@lru_cache(maxsize=1)
def get_embedding_model() -> HuggingFaceEmbeddings:
    return HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )


async def embed_and_store_profile(documents: list[Document], user_id: str) -> None:
    """
    [STEP 3] Injects the multi-tenant security user_id into document metadata,
    generates vector representations using an open-source Hugging Face model,
    and indexes them asynchronously into your Qdrant Cloud cluster.
    """
    # 1. Enforce multi-tenancy partitioning
    for doc in documents:
        doc.metadata["user_id"] = user_id

    qdrant_url = settings.QDRANT_URI
    qdrant_api_key = settings.QDRANT_API_KEY

    print(
        f"[VECTOR ENGINE] Initializing cloud handshakes with cluster endpoint: {qdrant_url}"
    )
    print(f"[VECTOR ENGINE] Document chunk count payload: {len(documents)}")

    try:
        # 2. Fire the asynchronous document push
        await QdrantVectorStore.afrom_documents(
            documents=documents,
            embedding=get_embedding_model(),
            url=qdrant_url,
            api_key=qdrant_api_key,
            collection_name="linkedin_profiles",
        )
        print(
            "[VECTOR ENGINE] Indexing complete! Data partitions are now locked and queryable."
        )

    except Exception as db_err:
        # Catching the exact downstream failure and forcing a console dump
        print("\n" + "!" * 60)
        print(f"[CRITICAL VECTOR PIPELINE FAILURE DETECTED]")
        print(f"Exception Class: {type(db_err).__name__}")
        print(f"Details: {str(db_err)}")
        print("!" * 60 + "\n")

        # Propagate custom message upward to trigger your FastAPI error handler
        raise RuntimeError(f"Failed to index documents to cloud cluster: {str(db_err)}")
