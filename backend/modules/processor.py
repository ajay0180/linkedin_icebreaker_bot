from schemas import ProfileData
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter


def compile_profile_text(profile: ProfileData) -> str:
    sections = [
        f"Professional Target Profile: {profile.full_name}",
        f"Professional Headline: {profile.headline or 'Not provided'}",
        f"Professional Summary: {profile.summary or 'Not provided'}",
    ]

    if profile.experiences:
        experience_lines = []
        for experience in profile.experiences:
            date_range = " - ".join(
                value
                for value in (experience.starts_at, experience.ends_at)
                if value
            )
            line = f"- {experience.title} at {experience.company or 'Not provided'}"
            if date_range:
                line += f" ({date_range})"
            if experience.description:
                line += f": {experience.description}"
            experience_lines.append(line)
        sections.append("Work History:\n" + "\n".join(experience_lines))

    if profile.education:
        education_lines = [
            "- "
            + ", ".join(
                value
                for value in (item.degree, item.field_of_study, item.school)
                if value
            )
            for item in profile.education
        ]
        sections.append("Education:\n" + "\n".join(education_lines))

    if profile.skills:
        sections.append("Skills: " + ", ".join(profile.skills))

    if profile.raw_text:
        sections.append("Imported Profile Content:\n" + profile.raw_text)

    return "\n\n".join(sections)


def split_profile_into_chunks(
    profile: ProfileData, profile_id: str
) -> list[Document]:
    """
    Takes the structured profile dictionary from the extractor, flattens it
    into a clean text layout, and splits it into semantic chunks with a safety overlap.

    Returns a list of LangChain Document objects ready for metadata tagging.
    """

    compiled_profile_text = compile_profile_text(profile)

    print(
        f"[PROCESSOR] Compiled raw profile text length: {len(compiled_profile_text)} characters."
    )

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=120,
        separators=["\n\n", "\n", ". ", " ", ""],
    )

    metadata = {
        "profile_id": profile_id,
        "profile_owner": profile.full_name,
        "source_type": profile.source_type,
    }
    if profile.source_url:
        metadata["source_url"] = str(profile.source_url)

    return text_splitter.create_documents(
        [compiled_profile_text], metadatas=[metadata]
    )
