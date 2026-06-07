from io import BytesIO

from pypdf import PdfReader

from schemas import ProfileData, TextProfileRequest

MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024
MAX_IMPORTED_TEXT_LENGTH = 100_000


def profile_from_text(payload: TextProfileRequest) -> ProfileData:
    return ProfileData(
        full_name=payload.full_name,
        headline=payload.headline,
        raw_text=payload.text[:MAX_IMPORTED_TEXT_LENGTH],
        source_type="text",
        source_url=payload.source_url,
    )


def profile_from_pdf(
    content: bytes,
    *,
    full_name: str,
    headline: str = "",
    source_url: str | None = None,
) -> ProfileData:
    if not content:
        raise ValueError("The uploaded PDF is empty.")
    if len(content) > MAX_PDF_SIZE_BYTES:
        raise ValueError("The uploaded PDF exceeds the 10 MB limit.")
    if not content.startswith(b"%PDF"):
        raise ValueError("The uploaded file is not a valid PDF.")

    try:
        reader = PdfReader(BytesIO(content))
        page_text = [page.extract_text() or "" for page in reader.pages]
    except Exception as exc:
        raise ValueError("The PDF could not be read.") from exc

    text = "\n\n".join(part.strip() for part in page_text if part.strip()).strip()
    if len(text) < 20:
        raise ValueError(
            "The PDF contains no extractable text. Upload a text-based PDF or paste the profile text."
        )

    return ProfileData(
        full_name=full_name,
        headline=headline,
        raw_text=text[:MAX_IMPORTED_TEXT_LENGTH],
        source_type="pdf",
        source_url=source_url,
    )
