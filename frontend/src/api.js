const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:8000").replace(
  /\/$/,
  "",
);

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error(
      "Cannot reach the backend. Confirm FastAPI is running on port 8000.",
    );
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.detail || "The request could not be completed.");
  }
  return data;
}

export function checkHealth() {
  return request("/health");
}

export function importTextProfile(userId, payload) {
  return request(
    `/api/v1/profile/import/text?x_user_id=${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function importManualProfile(userId, payload) {
  return request(
    `/api/v1/profile/import/manual?x_user_id=${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function importPdfProfile(userId, payload) {
  const formData = new FormData();
  formData.append("file", payload.file);
  formData.append("full_name", payload.fullName);
  formData.append("headline", payload.headline);
  if (payload.sourceUrl) formData.append("source_url", payload.sourceUrl);

  return request(
    `/api/v1/profile/import/pdf?x_user_id=${encodeURIComponent(userId)}`,
    { method: "POST", body: formData },
  );
}

export function chatWithProfile(userId, payload) {
  return request(
    `/api/v1/profile/chat?x_user_id=${encodeURIComponent(userId)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
