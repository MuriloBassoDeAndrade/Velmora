import { formDataToObject } from "../utils/forms.js";

export function registerNavigationEvents(ctx) {
  document.addEventListener("click", async (event) => {
    const adminTab = event.target.closest(".admin-tabs a[href^='#admin-']");
    if (adminTab) {
      const section = document.getElementById(adminTab.hash.slice(1));
      if (section) {
        event.preventDefault();
        history.pushState({}, "", adminTab.hash);
        document.querySelectorAll(".admin-tabs a").forEach((tab) => {
          const selected = tab === adminTab;
          tab.classList.toggle("is-active", selected);
          if (selected) tab.setAttribute("aria-current", "location");
          else tab.removeAttribute("aria-current");
        });
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }

    const link = event.target.closest("a[data-link]");
    if (link && link.origin === location.origin) {
      event.preventDefault();
      if (link.closest("#accountDialog")) ctx.accountDialog.close();
      if (link.closest("#cartDialog")) ctx.cartDialog.close();
      ctx.navigate(link.pathname + link.search + link.hash);
      return;
    }

    const close = event.target.closest("[data-close]");
    if (close) document.getElementById(close.dataset.close)?.close();
    if (event.target.closest("[data-clear-filters]")) ctx.navigate("/");

    const ordersPageButton = event.target.closest("button[data-orders-page]");
    if (ordersPageButton && !ordersPageButton.disabled) {
      const page = Number(ordersPageButton.dataset.ordersPage);
      if (!Number.isInteger(page) || page < 1) return;
      const params = new URLSearchParams(location.search);
      params.set("page", String(page));
      history.pushState({}, "", location.pathname + "?" + params.toString());
      await ctx.renderOrders();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const pageButton = event.target.closest(
      "button[data-page]:not([data-admin-page])",
    );
    if (pageButton) {
      const params = new URLSearchParams(location.search);
      params.set("page", pageButton.dataset.page);
      ctx.navigate("/?" + params.toString());
    }

    const adminPageButton = event.target.closest("button[data-admin-page]");
    if (adminPageButton && !adminPageButton.disabled) {
      const section = adminPageButton.dataset.adminPage;
      const page = Number(adminPageButton.dataset.page);
      if (!Number.isInteger(page) || page < 1) return;
      const params = new URLSearchParams(location.search);
      params.set("admin_" + section + "_page", String(page));
      history.pushState(
        {},
        "",
        location.pathname + "?" + params.toString() + "#admin-" + section,
      );
      await ctx.renderAdmin();
      document
        .getElementById("admin-" + section)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  ctx.app.addEventListener("submit", (event) => {
    const form = event.target;
    if (form.getAttribute("id") !== "catalogFilters") return;
    event.preventDefault();
    const data = formDataToObject(form);
    const params = new URLSearchParams();
    Object.entries(data).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    ctx.navigate("/" + (params.toString() ? "?" + params.toString() : ""));
  });

  window.addEventListener("popstate", ctx.renderRoute);
}
