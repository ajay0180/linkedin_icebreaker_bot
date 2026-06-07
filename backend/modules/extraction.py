LINKEDIN_IMPORT_MESSAGE = (
    "Direct LinkedIn URL scraping is not supported because LinkedIn blocks automated "
    "profile access. Upload the profile PDF, paste profile text, or submit structured "
    "profile data instead."
)


async def fetch_live_profile(linkedin_url: str) -> dict:
    """Compatibility shim for callers using the removed URL scraper."""
    raise RuntimeError(LINKEDIN_IMPORT_MESSAGE)
