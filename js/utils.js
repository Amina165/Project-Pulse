export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[c]));
}

export function safePhone(value) {
  return String(value ?? "").replace(/[^0-9+]/g, "");
}

export function safeNext(value, fallback) {
  return /^[a-z0-9_-]+\.html$/i.test(value || "") ? value : fallback;
}
