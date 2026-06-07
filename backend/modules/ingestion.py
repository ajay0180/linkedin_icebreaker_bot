from uuid import uuid4

from modules.embeddings import embed_and_store_profile
from modules.processor import split_profile_into_chunks
from schemas import ProfileData


async def index_profile(
    profile: ProfileData, *, user_id: str, profile_id: str | None = None
) -> dict:
    resolved_profile_id = profile_id or uuid4().hex
    chunks = split_profile_into_chunks(profile, resolved_profile_id)
    if not chunks:
        raise RuntimeError("The imported profile did not produce any indexable content.")

    await embed_and_store_profile(chunks, user_id=user_id)
    return {
        "status": "success",
        "message": f"Successfully indexed {profile.full_name}'s profile.",
        "profile_id": resolved_profile_id,
        "profile_owner": profile.full_name,
        "source_type": profile.source_type,
        "chunks_indexed": len(chunks),
    }
