export const money = (value) =>
  Number(value ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export const date = (value, options = {}) =>
  value ? new Date(value).toLocaleDateString("pt-BR", options) : "—";

export const dateTime = (value) =>
  value ? new Date(value).toLocaleString("pt-BR") : "—";

export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
