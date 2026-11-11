import { renderHome as renderHomePage } from "./pages/home.js";
import { renderProducts as renderProductsPage } from "./pages/products.js";
import { renderRegister as renderRegisterPage } from "./pages/register.js";
import { renderNotFound } from "./pages/404.js";
import { addressCard as renderAddressCard, addressForm as renderAddressForm } from "./pages/profile.js";
import { productAdminForm as renderProductAdminForm, categoryAdminForm as renderCategoryAdminForm } from "./pages/admin.js";
import { createCheckoutDialog as buildCheckoutDialog, addressFieldsMarkup as buildAddressFieldsMarkup } from "./pages/checkout.js";

import { renderProduct as renderProductPage } from "./pages/product.js";
import { renderOrders as renderOrdersPage } from "./pages/orders.js";
import { renderOrder as renderOrderPage } from "./pages/order.js";
import { renderProfile as renderProfilePage } from "./pages/profile.js";
import { renderAdmin as renderAdminPage } from "./pages/admin.js";
import { renderAuthForm as renderAuthFormPage } from "./pages/login.js";
import { openCart as openCartPage } from "./pages/cart.js";
import { openCheckout as openCheckoutPage } from "./pages/checkout.js";
import { renderRoute as renderRoutePage } from "./pages/router.js";
import { clearGuestToken } from "./api/http.js";
import { money, escapeHtml as esc } from "./utils/format.js";
import { formDataToObject } from "./utils/forms.js";
import { productCard, productImage } from "./components/productCard.js";
import { cartItem } from "./components/cartItem.js";
import { updateHeaderSession } from "./components/header.js";
import * as authApi from "./api/auth.js";
import * as productApi from "./api/products.js";
import * as cartApi from "./api/cart.js";
import * as ordersApi from "./api/orders.js";
import * as addressesApi from "./api/addresses.js";
import * as adminApi from "./api/admin.js";

const app = document.getElementById("app");
const cartDialog = document.getElementById("cartDialog");
const accountDialog = document.getElementById("accountDialog");
const cartContent = document.getElementById("cartContent");
const accountContent = document.getElementById("accountContent");
const toastNode = document.getElementById("toast");

let currentUser = null;
let cart = null;
let categories = [];
let toastTimer;

const unwrap = (payload) => payload?.data ?? payload;

function notify(message, type = "success") {
  toastNode.textContent = message;
  toastNode.className = "toast is-visible " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastNode.classList.remove("is-visible"), 3400);
}

function setSessionUI() {
  updateHeaderSession(currentUser);
  updateCartCount();
}
function updateCartCount() {
  const count = (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.getElementById("cartCount").textContent = String(count);
}
async function loadCart() {
  try {
    cart = unwrap(await cartApi.getCart());
    updateCartCount();
  } catch (error) {
    console.error(error);
  }
}
async function restoreSession() {
  try {
    currentUser = await authApi.getCurrentUser();
  } catch {
    currentUser = null;
  }
  setSessionUI();
  await loadCart();
}
function loading(message = "Carregando...") {
  app.innerHTML = '<section class="loading-state"><span class="spinner"></span><p>' + esc(message) + '</p></section>';
}
function errorPage(error) {
  app.innerHTML = '<section class="empty-state"><p class="eyebrow">Não foi possível concluir</p><h1>Algo deu errado</h1><p>' + esc(error.message) + '</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>';
}
function navigate(path) {
  const destination = new URL(path, location.href);
  const currentLocation = location.pathname + location.search + location.hash;
  const destinationLocation = destination.pathname + destination.search + destination.hash;
  const isSameLocation = destinationLocation === currentLocation;
  const isSameDefaultHome = destination.pathname === "/" && location.pathname === "/" &&
    !destination.search && new URLSearchParams(location.search).toString() === "page=home";
  if (isSameLocation || isSameDefaultHome) return;
  history.pushState({}, "", destinationLocation);
  renderRoute();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function currentPath() { return window.location.pathname.replace(/\/+$/, "") || "/"; }
async function fetchCategories() {
  const payload = await productApi.listCategories();
  categories = unwrap(payload) || [];
  return categories;
}
function statusLabel(status) {
  return ({ pending_payment: "Aguardando pagamento", paid: "Pago", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado" })[status] || status;
}
function requireAuth() {
  if (currentUser) return true;
  sessionStorage.setItem("velmora_after_login", currentPath());
  notify("Entre na sua conta para acessar esta página.", "error");
  renderAuthForm();
  accountDialog.showModal();
  return false;
}
async function finishLogin(payload) {
  currentUser = payload.user;
  clearGuestToken();
  cart = payload.cart || cart;
  setSessionUI();
  accountDialog.close();
  await loadCart();
  if (payload.adjustments?.length) notify("Algumas quantidades foram ajustadas ao estoque disponível.");
  if (sessionStorage.getItem("velmora_continue_to_checkout") === "1") {
    sessionStorage.removeItem("velmora_continue_to_checkout");
    sessionStorage.removeItem("velmora_after_login");
    await openCheckout();
    return;
  }
  const intended = sessionStorage.getItem("velmora_after_login");
  sessionStorage.removeItem("velmora_after_login");
  if (intended) navigate(intended);
  else if (currentPath().startsWith("/pages/")) navigate("/");
  else notify("Bem-vindo à Velmora!");
}

const context = {
  get currentUser() { return currentUser; },
  get cart() { return cart; },
  get categories() { return categories; },
  set categories(value) { categories = value; },
  app, cartDialog, accountDialog, cartContent, accountContent,
  get toastNode() { return toastNode; },
  money, esc, unwrap, notify, loading, errorPage, currentPath, navigate,
  fetchCategories, requireAuth, statusLabel, loadCart, updateCartCount,
  productApi, cartApi, ordersApi, addressesApi, adminApi,
  productCard, productImage, cartItem, addressCard, addressForm,
  productAdminForm, categoryAdminForm, createCheckoutDialog, addressFieldsMarkup,
  renderHome,
  renderProducts: (...args) => renderProductsPage(context, ...args),
  renderRegister: (...args) => renderRegisterPage(context, ...args),
  renderNotFound: () => renderNotFound(context),
  renderProduct,
  renderOrders,
  renderOrder,
  renderProfile,
  renderAdmin,
  renderAuthForm,
  openCart,
  openCheckout,
  renderRoute,
};
function addressCard(address) { return renderAddressCard(context, address); }
function addressForm(address) { return renderAddressForm(context, address); }
function productAdminForm(product) { return renderProductAdminForm(context, product); }
function categoryAdminForm(category) { return renderCategoryAdminForm(context, category); }
function createCheckoutDialog() { return buildCheckoutDialog(); }
function addressFieldsMarkup() { return buildAddressFieldsMarkup(); }
function renderHome(...args) { return renderHomePage(context, ...args); }
function renderProduct(...args) { return renderProductPage(context, ...args); }
function renderOrders(...args) { return renderOrdersPage(context, ...args); }
function renderOrder(...args) { return renderOrderPage(context, ...args); }
function renderProfile(...args) { return renderProfilePage(context, ...args); }
function renderAdmin(...args) { return renderAdminPage(context, ...args); }
function renderAuthForm(...args) { return renderAuthFormPage(context, ...args); }
function openCart(...args) { return openCartPage(context, ...args); }
function openCheckout(...args) { return openCheckoutPage(context, ...args); }
function renderRoute(...args) { return renderRoutePage(context, ...args); }

async function addProductToCart(form, button) {
  button.disabled = true;
  try {
    const data = formDataToObject(form);
    cart = unwrap(await cartApi.addCartItem({
      product_id: Number(data.product_id),
      quantity: Number(data.quantity),
    }));
    updateCartCount();
    await openCart();
    notify("Produto adicionado ao carrinho.");
  } catch (error) {
    notify(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

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
    if (link.closest("#accountDialog")) accountDialog.close();
    if (link.closest("#cartDialog")) cartDialog.close();
    navigate(link.pathname + link.search + link.hash);
    return;
  }
  const close = event.target.closest("[data-close]");
  if (close) document.getElementById(close.dataset.close)?.close();
  if (event.target.closest("#accountButton")) {
    renderAuthForm();
    accountDialog.showModal();
    return;
  }
  if (event.target.closest("#cartButton")) {
    await openCart();
    return;
  }
  if (event.target.closest("#checkoutButton")) {
    if (currentUser) {
      await openCheckout();
    } else {
      sessionStorage.setItem("velmora_continue_to_checkout", "1");
      requireAuth();
    }
    return;
  }
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) renderAuthForm(authMode.dataset.authMode);
  if (event.target.closest("[data-clear-filters]")) navigate("/");
  const ordersPageButton = event.target.closest("button[data-orders-page]");
  if (ordersPageButton && !ordersPageButton.disabled) {
    const page = Number(ordersPageButton.dataset.ordersPage);
    if (!Number.isInteger(page) || page < 1) return;
    const params = new URLSearchParams(location.search);
    params.set("page", String(page));
    history.pushState({}, "", location.pathname + "?" + params.toString());
    await renderOrders();
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }
  const pageButton = event.target.closest("button[data-page]:not([data-admin-page])");
  if (pageButton) {
    const params = new URLSearchParams(location.search);
    params.set("page", pageButton.dataset.page);
    navigate("/?" + params.toString());
  }
  const adminPageButton = event.target.closest("button[data-admin-page]");
  if (adminPageButton && !adminPageButton.disabled) {
    const section = adminPageButton.dataset.adminPage;
    const page = Number(adminPageButton.dataset.page);
    if (!Number.isInteger(page) || page < 1) return;
    const params = new URLSearchParams(location.search);
    params.set("admin_" + section + "_page", String(page));
    history.pushState({}, "", location.pathname + "?" + params.toString() + "#admin-" + section);
    await renderAdmin();
    document.getElementById("admin-" + section)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const addButton = event.target.closest("[data-add-product]");
  if (addButton) {
    event.preventDefault();
    await addProductToCart(addButton.form, addButton);
    return;
  }
  const cartAction = event.target.closest("[data-cart-change]");
  if (cartAction) {
    const id = cartAction.dataset.item;
    const item = cart?.items?.find((row) => String(row.id) === id);
    if (!item) return;
    const action = cartAction.dataset.cartChange;
    const quantity = action === "plus" ? item.quantity + 1 : action === "minus" ? item.quantity - 1 : 0;
    try {
      const result = action === "remove" || quantity < 1
        ? await cartApi.removeCartItem(id)
        : await cartApi.updateCartItem(id, { quantity });
      cart = unwrap(result); await openCart(); updateCartCount();
    } catch (error) { notify(error.message, "error"); }
  }
  const pay = event.target.closest("[data-pay]");
  if (pay) {
    try { await ordersApi.payOrder(pay.dataset.pay); notify("Pagamento simulado registrado."); renderOrder(pay.dataset.pay); }
    catch (error) { notify(error.message, "error"); }
  }
  const cancel = event.target.closest("[data-cancel-order]");
  if (cancel && confirm("Deseja cancelar este pedido? O estoque será devolvido.")) {
    try { await ordersApi.cancelOrder(cancel.dataset.cancelOrder); notify("Pedido cancelado."); renderOrder(cancel.dataset.cancelOrder); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-new-address]")) document.getElementById("addressEditor").innerHTML = addressForm();
  const editAddress = event.target.closest("[data-edit-address]");
  if (editAddress) {
    try { const list = unwrap(await addressesApi.listAddresses()); const address = list.find((a) => a.id === Number(editAddress.dataset.editAddress)); document.getElementById("addressEditor").innerHTML = addressForm(address); }
    catch (error) { notify(error.message, "error"); }
  }
  const deleteAddress = event.target.closest("[data-delete-address]");
  if (deleteAddress && confirm("Excluir este endereço?")) {
    try { await addressesApi.deleteAddress(deleteAddress.dataset.deleteAddress); notify("Endereço excluído."); renderProfile(); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-cancel-address]")) document.getElementById("addressEditor").innerHTML = "";
  if (event.target.closest("[data-new-product]")) document.getElementById("productEditor").innerHTML = productAdminForm();
  const editProduct = event.target.closest("[data-edit-product]");
  if (editProduct) {
    try { const product = unwrap(await adminApi.getAdminProduct(editProduct.dataset.editProduct)); document.getElementById("productEditor").innerHTML = productAdminForm(product); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-new-category]")) document.getElementById("categoryEditor").innerHTML = categoryAdminForm();
  const editCategory = event.target.closest("[data-edit-category]");
  if (editCategory) {
    const category = categories.find((c) => c.id === Number(editCategory.dataset.editCategory));
    if (category) document.getElementById("categoryEditor").innerHTML = categoryAdminForm(category);
  }
  const closeEditor = event.target.closest("[data-close-editor]");
  if (closeEditor) document.getElementById(closeEditor.dataset.closeEditor).innerHTML = "";
  const deleteProduct = event.target.closest("[data-delete-product]");
  if (deleteProduct && confirm("Excluir logicamente este produto? Pedidos antigos serão preservados.")) {
    try { await adminApi.deleteProduct(deleteProduct.dataset.deleteProduct); notify("Produto excluído."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
  const deleteCategory = event.target.closest("[data-delete-category]");
  if (deleteCategory && confirm("Excluir esta categoria?")) {
    try { await adminApi.deleteCategory(deleteCategory.dataset.deleteCategory); notify("Categoria excluída."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
  const orderStatus = event.target.closest("[data-order-status]");
  if (orderStatus) {
    try { await adminApi.updateOrderStatus(orderStatus.dataset.orderStatus, orderStatus.dataset.nextStatus); notify("Status do pedido atualizado."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
});
document.getElementById("accountContent").addEventListener("click", async (event) => {
  if (event.target.closest("#logoutButton")) {
    try { await authApi.logout(); currentUser = null; clearGuestToken(); setSessionUI(); accountDialog.close(); await loadCart(); notify("Sessão encerrada."); if (currentPath() !== "/") navigate("/"); }
    catch (error) { notify(error.message, "error"); }
  }
});
document.getElementById("accountContent").addEventListener("submit", async (event) => {
  if (event.target.getAttribute("id") !== "authForm") return;
  event.preventDefault();
  const data = formDataToObject(event.target);
  try {
    const isRegister = Boolean(data.name);
    const payload = await (isRegister ? authApi.register(data) : authApi.login(data));
    await finishLogin(payload);
  } catch (error) { notify(error.message, "error"); }
});
document.addEventListener("submit", async (event) => {
  const form = event.target;
  if (form.getAttribute("id") !== "checkoutForm") return;
  event.preventDefault();
  try {
    const data = formDataToObject(form);
    let addressId = data.address_id;
    if (!addressId) {
      const addressData = { ...data };
      delete addressData.address_id;
      const address = unwrap(await addressesApi.createAddress(addressData));
      addressId = address.id;
    }
    const order = unwrap(await ordersApi.createOrder({ address_id: Number(addressId) }));
    document.getElementById("checkoutDialog").close();
    await loadCart();
    notify("Pedido criado. Confirme o pagamento simulado.");
    navigate("/pedido/" + order.id);
  } catch (error) { notify(error.message, "error"); }
});
app.addEventListener("submit", async (event) => {
  const form = event.target;
  const formId = form.getAttribute("id");
  event.preventDefault();
  try {
    if (formId === "catalogFilters") {
      const data = formDataToObject(form);
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => { if (value) params.set(key, value); });
      navigate("/" + (params.toString() ? "?" + params.toString() : ""));
    } else if (formId === "addProductForm") {
      await addProductToCart(form, form.querySelector("[data-add-product]"));
    } else if (formId === "profileForm") {
      const data = formDataToObject(form);
      Object.keys(data).forEach((key) => { if (!data[key]) delete data[key]; });
      currentUser = await authApi.updateProfile(data);
      setSessionUI(); notify("Perfil atualizado."); renderProfile();
    } else if (formId === "passwordForm") {
      const data = formDataToObject(form);
      await authApi.updateProfile(data);
      form.reset();
      notify("Senha atualizada com sucesso.");
    } else if (formId === "addressForm") {
      const data = formDataToObject(form);
      const id = data.id; delete data.id;
      await (id ? addressesApi.updateAddress(id, data) : addressesApi.createAddress(data));
      notify("Endereço salvo."); renderProfile();
    } else if (formId === "adminProductForm") {
      const formData = new FormData(form);
      const id = formData.get("id");
      formData.delete("id");
      if (id) formData.append("_method", "PUT");
      await (id ? adminApi.updateProduct(id, formData) : adminApi.createProduct(formData));
      notify("Produto salvo."); renderAdmin();
    } else if (formId === "adminCategoryForm") {
      const data = formDataToObject(form);
      const id = data.id; delete data.id;
      await (id ? adminApi.updateCategory(id, data) : adminApi.createCategory(data));
      notify("Categoria salva."); renderAdmin();
    } else if (form.matches("[data-stock-form]")) {
      const data = formDataToObject(form);
      await adminApi.updateProductStock(form.dataset.stockForm, Number(data.stock));
      notify("Estoque atualizado.");
    } else if (formId === "adminOrderFilter") {
      const status = new FormData(form).get("status");
      const params = new URLSearchParams(location.search);
      if (status) params.set("admin_order_status", status);
      else params.delete("admin_order_status");
      params.delete("admin_orders_page");
      const query = params.toString();
      history.pushState({}, "", location.pathname + (query ? "?" + query : "") + "#admin-orders");
      await renderAdmin();
      document.getElementById("admin-orders")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (error) { notify(error.message, "error"); }
});
window.addEventListener("popstate", renderRoute);

app.addEventListener("change", (event) => {
  const input = event.target;
  if (!input.matches('#adminProductForm input[name="image"]')) return;

  const file = input.files?.[0];
  if (!file) return;

  const preview = document.querySelector("[data-product-image-preview]");
  if (!preview) return;

  const image = document.createElement("img");
  const objectUrl = URL.createObjectURL(file);
  image.className = "admin-product-preview-image";
  image.alt = "Prévia da imagem selecionada";
  image.dataset.previewUrl = objectUrl;
  image.onload = () => {
    URL.revokeObjectURL(objectUrl);
    delete image.dataset.previewUrl;
  };
  image.onerror = () => {
    URL.revokeObjectURL(objectUrl);
    delete image.dataset.previewUrl;
    notify("Não foi possível carregar a prévia da imagem selecionada.", "error");
  };
  image.src = objectUrl;
  preview.replaceChildren(image);
});

async function initializeApp() {
  await restoreSession();
  await renderRoute();
}

initializeApp();
