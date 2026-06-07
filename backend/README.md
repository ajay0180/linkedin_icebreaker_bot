# LinkedIn Icebreaker Bot Backend

FastAPI backend for importing consented professional profile data, indexing it
in Qdrant, and generating profile-grounded responses with Gemini.

Direct LinkedIn scraping is intentionally unsupported. LinkedIn blocks
automated profile access, and a blocked request must never fall back to another
person's mock data.

## Setup

```bash
uv sync
uv run fastapi dev main.py
```

Required `.env` variables:

```dotenv
QDRANT_URI=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-key
GOOGLE_GEMINI_API_KEY=your-gemini-key
FRONTEND_ORIGINS=http://localhost:5173
```

## Import a profile

Every import requires `x_user_id` as a query parameter and returns a
`profile_id`. Pass that `profile_id` to chat requests to isolate a specific
target profile.

### PDF

```bash
curl -X POST \
  "http://localhost:8000/api/v1/profile/import/pdf?x_user_id=user-123" \
  -F "file=@linkedin-profile.pdf;type=application/pdf" \
  -F "full_name=Ada Lovelace" \
  -F "headline=Software Engineer" \
  -F "source_url=https://www.linkedin.com/in/example"
```

The PDF must contain selectable text. Scanned image-only PDFs require OCR,
which is not part of this backend.

### Pasted text

```bash
curl -X POST \
  "http://localhost:8000/api/v1/profile/import/text?x_user_id=user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ada Lovelace",
    "headline": "Software Engineer",
    "text": "Profile text copied with the profile owner permission."
  }'
```

### Structured data

```bash
curl -X POST \
  "http://localhost:8000/api/v1/profile/import/manual?x_user_id=user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Ada Lovelace",
    "headline": "Software Engineer",
    "summary": "Builds reliable analytical systems.",
    "skills": ["Python", "Distributed systems"],
    "experiences": [
      {
        "title": "Engineer",
        "company": "Example"
      }
    ]
  }'
```

## Chat

```bash
curl -X POST \
  "http://localhost:8000/api/v1/profile/chat?x_user_id=user-123" \
  -H "Content-Type: application/json" \
  -d '{
    "profile_id": "profile-id-returned-by-import",
    "query": "Write a concise icebreaker based on their recent work.",
    "history": []
  }'
```
