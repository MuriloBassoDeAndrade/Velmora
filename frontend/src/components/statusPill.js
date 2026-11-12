import { escapeHtml } from "../utils/format.js";

export function statusPill(status, label) {
  return (
    '<span class="status-pill status-' +
    escapeHtml(status) +
    '">' +
    escapeHtml(label) +
    "</span>"
  );
}
