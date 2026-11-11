import { clearGuestToken } from "../api/http.js";
import { formDataToObject } from "../utils/forms.js";

export function registerAuthEvents(ctx) {
  document.addEventListener("click", (event) => {
    if (event.target.closest("#accountButton")) {
      ctx.renderAuthForm();
      ctx.accountDialog.showModal();
      return;
    }

    const authMode = event.target.closest("[data-auth-mode]");
    if (authMode) ctx.renderAuthForm(authMode.dataset.authMode);
  });

  ctx.accountContent.addEventListener("click", async (event) => {
    if (!event.target.closest("#logoutButton")) return;
    try {
      await ctx.authApi.logout();
      ctx.currentUser = null;
      clearGuestToken();
      ctx.setSessionUI();
      ctx.accountDialog.close();
      await ctx.loadCart();
      ctx.notify("Sessão encerrada.");
      if (ctx.currentPath() !== "/") ctx.navigate("/");
    } catch (error) {
      ctx.notify(error.message, "error");
    }
  });

  ctx.accountContent.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.getAttribute("id") !== "authForm") return;
    event.preventDefault();
    const data = formDataToObject(form);
    try {
      const isRegister = Boolean(data.name);
      const payload = await (isRegister ? ctx.authApi.register(data) : ctx.authApi.login(data));
      await ctx.finishLogin(payload);
    } catch (error) {
      ctx.notify(error.message, "error");
    }
  });
}
