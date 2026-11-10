export async function renderRoute(ctx) {
  const { currentPath, app, renderAuthForm, accountDialog, renderHome, renderProduct, openCart, openCheckout, renderOrders, renderOrder, renderProfile, renderAdmin, errorPage } = ctx;
  const path = currentPath();
  const entryPage = document.body.dataset.page || null;

  document.querySelectorAll(".nav a[data-link]").forEach((link) => {
    const target = link.getAttribute("href");
    const active = target === "/" ? entryPage === "home" || entryPage === "products" || entryPage === "product" || path.startsWith("/produto/") : target === "/pedidos" ? entryPage === "orders" || entryPage === "order" || path.startsWith("/pedido/") : target === "/perfil" ? entryPage === "profile" || path === "/perfil" : target === "/admin" ? entryPage === "admin" || path === "/admin" : false;
    link.classList.toggle("is-active", active);
  });

  if (entryPage === "login" || entryPage === "register") {
    renderAuthForm(entryPage === "register" ? "register" : "login");
    if (!accountDialog.open) accountDialog.showModal();
    return;
  }
  if (entryPage === "home" || entryPage === "products") return renderHome(new URLSearchParams(location.search));
  if (entryPage === "product") {
    const id = new URLSearchParams(location.search).get("id");
    return id ? renderProduct(id) : errorPage(new Error("Informe o ID do produto na URL."));
  }
  if (entryPage === "cart") return openCart();
  if (entryPage === "checkout") return openCheckout();
  if (entryPage === "orders") return renderOrders();
  if (entryPage === "order") {
    const id = new URLSearchParams(location.search).get("id");
    return id ? renderOrder(id) : errorPage(new Error("Informe o ID do pedido na URL."));
  }
  if (entryPage === "profile") return renderProfile();
  if (entryPage === "admin") return renderAdmin();
  if (entryPage === "404") {
    app.innerHTML = '<section class="empty-state"><p class="eyebrow">404</p><h1>Página não encontrada</h1><p>O endereço acessado não existe.</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>';
    return;
  }

  if (path === "/") return renderHome(new URLSearchParams(location.search));
  if (path.startsWith("/produto/")) return renderProduct(path.split("/")[2]);
  if (path === "/pedidos") return renderOrders();
  if (path.startsWith("/pedido/")) return renderOrder(path.split("/")[2]);
  if (path === "/perfil") return renderProfile();
  if (path === "/admin") return renderAdmin();
  app.innerHTML = '<section class="empty-state"><p class="eyebrow">404</p><h1>Página não encontrada</h1><p>O endereço acessado não existe.</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>';
}
