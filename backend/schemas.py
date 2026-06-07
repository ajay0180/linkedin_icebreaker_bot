from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, field_validator


class Experience(BaseModel):
    title: str
    company: str = ""
    starts_at: str | None = None
    ends_at: str | None = None
    description: str = ""


class Education(BaseModel):
    school: str
    degree: str = ""
    field_of_study: str = ""
    starts_at: str | None = None
    ends_at: str | None = None


class ProfileData(BaseModel):
    full_name: str = Field(min_length=1)
    headline: str = ""
    summary: str = ""
    experiences: list[Experience] = Field(default_factory=list)
    education: list[Education] = Field(default_factory=list)
    skills: list[str] = Field(default_factory=list)
    raw_text: str = ""
    source_type: Literal["manual", "text", "pdf", "linkedin_oauth"] = "manual"
    source_url: HttpUrl | None = None

    @field_validator("full_name", "headline", "summary", "raw_text")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip()

    @field_validator("skills")
    @classmethod
    def clean_skills(cls, skills: list[str]) -> list[str]:
        return [skill.strip() for skill in skills if skill.strip()]


class TextProfileRequest(BaseModel):
    full_name: str = Field(min_length=1)
    text: str = Field(min_length=20)
    headline: str = ""
    source_url: HttpUrl | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(..., description="The text content of the message")


class ChatRequest(BaseModel):
    query: str = Field(min_length=1, description="The user's current incoming question")
    profile_id: str | None = Field(
        default=None,
        description="Optional target profile partition. Recommended when a user has imported multiple profiles.",
    )
    history: list[ChatMessage] = Field(
        default_factory=list, description="Prior multi-turn message history context"
    )
