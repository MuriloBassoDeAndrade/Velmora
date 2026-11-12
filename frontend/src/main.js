import { renderHome as renderHomePage } from "./pages/home.js";
import { renderProducts as renderProductsPage } from "./pages/products.js";
import { renderRegister as renderRegisterPage } from "./pages/register.js";
import { renderNotFound } from "./pages/404.js";
import {
  addressCard as renderAddressCard,
  addressForm as renderAddressForm,
} from "./pages/profile.js";
import {
  productAdminForm as renderProductAdminForm,
  categoryAdminForm as renderCategoryAdminForm,
} from "./pages/admin.js";
import {
  createCheckoutDialog as buildCheckoutDialog,
  addressFieldsMarkup as buildAddressFieldsMarkup,
} from "./pages/checkout.js";

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
import { productCard, productImage } from "./components/productCard.js";
import { cartItem } from "./components/cartItem.js";
import { updateHeaderSession } from "./components/header.js";
import * as authApi from "./api/auth.js";
import * as productApi from "./api/products.js";
import * as cartApi from "./api/cart.js";
import * as ordersApi from "./api/orders.js";
import * as addressesApi from "./api/addresses.js";
import * as adminApi from "./api/admin.js";
import { registerNavigationEvents } from "./events/navigation.js";
import { registerCartEvents } from "./events/cart.js";
import { registerAuthEvents } from "./events/auth.js";
import { registerCheckoutEvents } from "./events/checkout.js";
import { registerOrderEvents } from "./events/orders.js";
import { registerProfileEvents } from "./events/profile.js";
import { registerAdminEvents } from "./events/admin.js";

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
  const count = (cart?.items || []).reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  );
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
  app.innerHTML =
    '<section class="loading-state"><span class="spinner"></span><p>' +
    esc(message) +
    "</p></section>";
}
function errorPage(error) {
  app.innerHTML =
    '<section class="empty-state"><p class="eyebrow">Não foi possível concluir</p><h1>Algo deu errado</h1><p>' +
    esc(error.message) +
    '</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>';
}
function navigate(path) {
  const destination = new URL(path, location.href);
  const currentLocation = location.pathname + location.search + location.hash;
  const destinationLocation =
    destination.pathname + destination.search + destination.hash;
  const isSameLocation = destinationLocation === currentLocation;
  const isSameDefaultHome =
    destination.pathname === "/" &&
    location.pathname === "/" &&
    !destination.search &&
    new URLSearchParams(location.search).toString() === "page=home";
  if (isSameLocation || isSameDefaultHome) return;
  history.pushState({}, "", destinationLocation);
  renderRoute();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function currentPath() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}
async function fetchCategories() {
  const payload = await productApi.listCategories();
  categories = unwrap(payload) || [];
  return categories;
}
function statusLabel(status) {
  return (
    {
      pending_payment: "Aguardando pagamento",
      paid: "Pago",
      shipped: "Enviado",
      delivered: "Entregue",
      cancelled: "Cancelado",
    }[status] || status
  );
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
  if (payload.adjustments?.length)
    notify("Algumas quantidades foram ajustadas ao estoque disponível.");
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
  get currentUser() {
    return currentUser;
  },
  set currentUser(value) {
    currentUser = value;
  },
  get cart() {
    return cart;
  },
  set cart(value) {
    cart = value;
  },
  get categories() {
    return categories;
  },
  set categories(value) {
    categories = value;
  },
  app,
  cartDialog,
  accountDialog,
  cartContent,
  accountContent,
  get toastNode() {
    return toastNode;
  },
  money,
  esc,
  unwrap,
  notify,
  loading,
  errorPage,
  currentPath,
  navigate,
  fetchCategories,
  requireAuth,
  statusLabel,
  loadCart,
  updateCartCount,
  setSessionUI,
  finishLogin,
  authApi,
  productApi,
  cartApi,
  ordersApi,
  addressesApi,
  adminApi,
  productCard,
  productImage,
  cartItem,
  addressCard,
  addressForm,
  productAdminForm,
  categoryAdminForm,
  createCheckoutDialog,
  addressFieldsMarkup,
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
function addressCard(address) {
  return renderAddressCard(context, address);
}
function addressForm(address) {
  return renderAddressForm(context, address);
}
function productAdminForm(product) {
  return renderProductAdminForm(context, product);
}
function categoryAdminForm(category) {
  return renderCategoryAdminForm(context, category);
}
function createCheckoutDialog() {
  return buildCheckoutDialog();
}
function addressFieldsMarkup() {
  return buildAddressFieldsMarkup();
}
function renderHome(...args) {
  return renderHomePage(context, ...args);
}
function renderProduct(...args) {
  return renderProductPage(context, ...args);
}
function renderOrders(...args) {
  return renderOrdersPage(context, ...args);
}
function renderOrder(...args) {
  return renderOrderPage(context, ...args);
}
function renderProfile(...args) {
  return renderProfilePage(context, ...args);
}
function renderAdmin(...args) {
  return renderAdminPage(context, ...args);
}
function renderAuthForm(...args) {
  return renderAuthFormPage(context, ...args);
}
function openCart(...args) {
  return openCartPage(context, ...args);
}
function openCheckout(...args) {
  return openCheckoutPage(context, ...args);
}
function renderRoute(...args) {
  return renderRoutePage(context, ...args);
}

registerNavigationEvents(context);
registerCartEvents(context);
registerAuthEvents(context);
registerCheckoutEvents(context);
registerOrderEvents(context);
registerProfileEvents(context);
registerAdminEvents(context);

async function initializeApp() {
  await restoreSession();
  await renderRoute();
}

initializeApp();
