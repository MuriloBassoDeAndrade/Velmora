export async function renderRoute(ctx) {
  const { currentPath, app, renderAuthForm, renderRegister, renderProducts, renderNotFound, accountDialog, renderHome, renderProduct, openCart, openCheckout, renderOrders, renderOrder, renderProfile, renderAdmin, errorPage } = ctx;
  const path = currentPath();
  const entryPage = document.body.dataset.page || null;

  document.querySelectorAll(".nav a[data-link]").forEach((link) => {
    const target = link.getAttribute("href");
    const active = target === "/" ? entryPage === "home" || entryPage === "products" || entryPage === "product" || path.startsWith("/produto/") : target === "/pedidos" ? entryPage === "orders" || entryPage === "order" || path.startsWith("/pedido/") : target === "/perfil" ? entryPage === "profile" || path === "/perfil" : target === "/admin" ? entryPage === "admin" || path === "/admin" : false;
    link.classList.toggle("is-active", active);
  });

  if (entryPage === "login" || entryPage === "register") {
    if (entryPage === "register") renderRegister();
    else renderAuthForm("login");
    if (!accountDialog.open) accountDialog.showModal();
    return;
  }
  if (entryPage === "home") return renderHome(new URLSearchParams(location.search));
  if (entryPage === "products") return renderProducts(new URLSearchParams(location.search));
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
  if (entryPage === "404") return renderNotFound();

  if (path === "/") return renderHome(new URLSearchParams(location.search));
  if (path.startsWith("/produto/")) return renderProduct(path.split("/")[2]);
  if (path === "/pedidos") return renderOrders();
  if (path.startsWith("/pedido/")) return renderOrder(path.split("/")[2]);
  if (path === "/perfil") return renderProfile();
  if (path === "/admin") return renderAdmin();
  return renderNotFound();
}
