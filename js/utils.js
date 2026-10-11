// Small shared helpers

// Escape user-provided text before putting it into innerHTML (prevents script injection)
export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

// Keep only characters that are valid in a tel: link
export function safePhone(value) {
  return String(value ?? "").replace(/[^0-9+]/g, "");
}

// Only allow redirects to local pages like "donate.html"
export function safeNext(value, fallback) {
  return /^[a-z0-9_-]+\.html$/i.test(value || "") ? value : fallback;
}
