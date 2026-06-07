import traceback
from fastapi import FastAPI, File, Form, HTTPException, Query, UploadFile, status
from fastapi.middleware.cors import CORSMiddleware
from schemas import ChatRequest, ProfileData, TextProfileRequest
from modules.extraction import LINKEDIN_IMPORT_MESSAGE
from modules.ingestion import index_profile
from modules.profile_sources import profile_from_pdf, profile_from_text
from qdrant_client import QdrantClient
from qdrant_client.models import Filter, FieldCondition, MatchValue, PayloadSchemaType
from langchain_qdrant import QdrantVectorStore
from modules.embeddings import get_embedding_model
from config import settings
from langchain.chat_models import init_chat_model
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser

app = FastAPI(
    title="LinkedIn Icebreaker Bot API",
    version="0.2.0",
    description="Imports consented profile data and provides profile-grounded chat.",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


async def ingest(profile: ProfileData, user_id: str) -> dict:
    try:
        return await index_profile(profile, user_id=user_id)
    except (RuntimeError, ValueError) as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err
    except Exception as err:
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal profile ingestion failure.",
        ) from err


@app.post(
    "/api/v1/profile/process",
    include_in_schema=True,
    name="process_profile",
    status_code=status.HTTP_201_CREATED,
)
async def process_profile(
    linkedin_url: str,
    x_user_id: str = Query(..., description="User ID passed in URL query string"),
):
    del linkedin_url, x_user_id
    raise HTTPException(
        status_code=status.HTTP_410_GONE,
        detail=LINKEDIN_IMPORT_MESSAGE,
    )


@app.post(
    "/api/v1/profile/import/manual",
    status_code=status.HTTP_201_CREATED,
    name="import_manual_profile",
)
async def import_manual_profile(
    payload: ProfileData,
    x_user_id: str = Query(..., min_length=1, description="User partition key"),
):
    payload.source_type = "manual"
    return await ingest(payload, x_user_id)


@app.post(
    "/api/v1/profile/import/text",
    status_code=status.HTTP_201_CREATED,
    name="import_text_profile",
)
async def import_text_profile(
    payload: TextProfileRequest,
    x_user_id: str = Query(..., min_length=1, description="User partition key"),
):
    return await ingest(profile_from_text(payload), x_user_id)


@app.post(
    "/api/v1/profile/import/pdf",
    status_code=status.HTTP_201_CREATED,
    name="import_pdf_profile",
)
async def import_pdf_profile(
    file: UploadFile = File(..., description="LinkedIn profile or resume PDF"),
    full_name: str = Form(..., min_length=1),
    headline: str = Form(""),
    source_url: str | None = Form(None),
    x_user_id: str = Query(..., min_length=1, description="User partition key"),
):
    if file.content_type not in {"application/pdf", "application/octet-stream"}:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF uploads are supported.",
        )

    try:
        content = await file.read()
        profile = profile_from_pdf(
            content,
            full_name=full_name,
            headline=headline,
            source_url=source_url,
        )
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail=str(err)
        ) from err
    finally:
        await file.close()

    return await ingest(profile, x_user_id)


@app.post(
    "/api/v1/profile/chat",
    include_in_schema=True,
    name="chat_on_profile",
    status_code=status.HTTP_200_OK,
)
async def chat_profile(
    payload: ChatRequest,
    x_user_id: str = Query(
        ..., description="Multi-tenant User ID partition key string"
    ),
):
    """
    Chat Workspace Endpoint: Performs a multi-tenant semantic vector retrieval
    against Qdrant and processes the context through an LCEL pipeline.
    """

    try:
        llm_model = init_chat_model(
            "gemini-2.5-flash",
            model_provider="google_genai",
            api_key=settings.GOOGLE_GEMINI_API_KEY,
        )

        qdrant_url = settings.QDRANT_URI
        qdrant_api_key = settings.QDRANT_API_KEY

        client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key,
        )

        for field_name in ("metadata.user_id", "metadata.profile_id"):
            try:
                client.create_payload_index(
                    collection_name="linkedin_profiles",
                    field_name=field_name,
                    field_schema=PayloadSchemaType.KEYWORD,
                )
            except Exception:
                pass

        vector_store = QdrantVectorStore(
            client=client,
            embedding=get_embedding_model(),
            collection_name="linkedin_profiles",
        )

        filter_conditions = [
            FieldCondition(
                key="metadata.user_id",
                match=MatchValue(value=x_user_id),
            )
        ]
        if payload.profile_id:
            filter_conditions.append(
                FieldCondition(
                    key="metadata.profile_id",
                    match=MatchValue(value=payload.profile_id),
                )
            )
        search_filter = Filter(must=filter_conditions)

        # Execute multi-tenant isolated search
        retrieved_doc = await vector_store.asimilarity_search(
            k=5, filter=search_filter, query=payload.query
        )

        context_block = "\n---\n".join([doc.page_content for doc in retrieved_doc])
        if not context_block:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No imported profile data was found for this user and profile_id.",
            )

        prompt_messages = [
            (
                "system",
                (
                    "You create concise, professional icebreakers and profile insights. "
                    "Use only the imported candidate context below. Do not invent facts. "
                    "If the context is insufficient, say what information is missing.\n\n"
                    "Candidate Context:\n{context}"
                ),
            )
        ]
        prompt_messages.extend(
            (message.role, message.content) for message in payload.history[-10:]
        )
        prompt_messages.append(("human", "{question}"))
        prompt = ChatPromptTemplate.from_messages(prompt_messages)

        lcel_chain = prompt | llm_model | StrOutputParser()

        ai_response = await lcel_chain.ainvoke(
            {"context": context_block, "question": payload.query}
        )

        return {
            "status": "success",
            "retrieved_context_doc": context_block,
            "response": ai_response,
        }
    except HTTPException:
        raise
    except Exception as e:
        print("\n❌ [CHAT CRASHED]")
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat workspace engine encountered an internal generation error: {str(e)}",
        )


@app.get("/health", include_in_schema=False)
async def app_logging():
    return {"message": "Backend is running!"}
