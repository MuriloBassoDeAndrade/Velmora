export function updateHeaderSession(user) {
  const accountButton = document.getElementById("accountButton");
  if (accountButton) accountButton.textContent = user ? user.name : "Entrar";
  document.querySelectorAll("[data-auth-link]").forEach((node) => { node.hidden = !user; });
  document.querySelectorAll("[data-admin-link]").forEach((node) => { node.hidden = !user || user.role !== "admin"; });
}
