// Integração da vitrine e do carrinho com a API Laravel.
const PRODUCTS_API_URL = "/api/products";
const CART_API_URL = "/api/cart";
const GUEST_TOKEN_KEY = "velmora_guest_token";

let products = [];
let cart = null;
let activeFilter = "all";

const productGrid = document.getElementById("productGrid");
const cartButton = document.getElementById("cartButton");
const cartCount = document.getElementById("cartCount");
const cartDialog = document.getElementById("cartDialog");
const cartContent = document.getElementById("cartContent");
const cartTotal = document.getElementById("cartTotal");
const closeCartButton = document.getElementById("closeCart");

const formatPrice = (value) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function guestToken() { return localStorage.getItem(GUEST_TOKEN_KEY); }
function rememberGuestToken(response) {
  const token = response.headers.get("X-Guest-Token");
  if (token) localStorage.setItem(GUEST_TOKEN_KEY, token);
}

async function apiRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const token = guestToken();
  if (token) headers.set("X-Guest-Token", token);

  const response = await fetch(url, { ...options, headers, credentials: "include" });
  rememberGuestToken(response);
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || `Erro HTTP ${response.status}`;
    const details = payload?.errors ? Object.values(payload.errors).flat().join(" ") : "";
    throw new Error(details ? `${message} ${details}` : message);
  }
  return payload;
}

function showStatus(message) { productGrid.innerHTML = `<p class="status">${escapeHtml(message)}</p>`; }
function productGender(product) {
  const gender = String(product.characteristics?.gender || "").toLowerCase();
  if (gender.includes("femin")) return "female";
  if (gender.includes("mascul")) return "male";
  return "all";
}
function visibleProducts() {
  return activeFilter === "all" ? products : products.filter((product) => productGender(product) === activeFilter);
}
function renderProducts() {
  const visible = visibleProducts();
  if (!visible.length) return showStatus("Nenhum relógio encontrado nesta categoria.");

  productGrid.innerHTML = visible.map((product) => {
    const outOfStock = Number(product.stock) < 1;
    const image = product.image_url
      ? `<img class="product-image" src="${escapeHtml(product.image_url)}" alt="${escapeHtml(product.name)}" loading="lazy">`
      : `<div class="dial product-dial" role="img" aria-label="Mostrador ilustrativo de ${escapeHtml(product.name)}"><div class="hand h"></div><div class="hand m"></div><div class="pin"></div></div>`;
    return `<article class="product">
      ${image}
      <h3>${escapeHtml(product.name)}</h3>
      <p class="meta">${escapeHtml(product.brand)} · ${escapeHtml(product.characteristics?.movement_type || "Relógio")}</p>
      <div class="buy"><span class="price">${formatPrice(product.price)}</span>
      <button class="add" type="button" data-add-id="${product.id}" ${outOfStock ? "disabled" : ""}>${outOfStock ? "Indisponível" : "Adicionar"}</button></div>
    </article>`;
  }).join("");
}
function setFilter(filter) {
  activeFilter = filter;
  document.querySelectorAll(".filter").forEach((button) => button.classList.toggle("is-active", button.dataset.filter === filter));
  renderProducts();
}
function cartQuantity() { return (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0); }
function updateCartCount() { cartCount.textContent = String(cartQuantity()); }

function renderCart() {
  const items = cart?.items || [];
  if (!items.length) {
    cartContent.innerHTML = '<p class="status">Seu carrinho está vazio.</p>';
    cartTotal.textContent = formatPrice(0);
    return;
  }
  cartContent.innerHTML = items.map((item) => {
    const product = item.product;
    const unavailable = item.unavailable || !product;
    return `<article class="cart-line"><div>
      <strong>${escapeHtml(product?.name || "Produto indisponível")}</strong>
      <p class="meta">${formatPrice(product?.price)} · Subtotal: ${formatPrice(item.subtotal)}</p>
      ${unavailable ? '<p class="cart-warning">Produto indisponível para compra.</p>' : item.exceeds_stock ? '<p class="cart-warning">Quantidade acima do estoque disponível.</p>' : ""}
      </div><div class="cart-controls">
      <button type="button" data-cart-action="decrease" data-item-id="${item.id}" aria-label="Diminuir quantidade">−</button>
      <span>${item.quantity}</span>
      <button type="button" data-cart-action="increase" data-item-id="${item.id}" aria-label="Aumentar quantidade" ${unavailable ? "disabled" : ""}>+</button>
      <button type="button" data-cart-action="remove" data-item-id="${item.id}">Remover</button>
      </div></article>`;
  }).join("");
  cartTotal.textContent = formatPrice(cart.total);
}

async function loadCart() {
  try {
    const payload = await apiRequest(CART_API_URL);
    cart = payload?.data || payload;
    updateCartCount();
    renderCart();
  } catch (error) {
    console.error("Erro ao carregar carrinho:", error);
    cartContent.innerHTML = `<p class="status">${escapeHtml(error.message)}</p>`;
  }
}
async function loadProducts() {
  showStatus("Carregando relógios...");
  try {
    const payload = await apiRequest(`${PRODUCTS_API_URL}?sort=recent`);
    products = payload?.data || [];
    renderProducts();
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    showStatus("Não foi possível carregar os relógios. Tente novamente em instantes.");
  }
}

productGrid.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-add-id]");
  if (!button) return;
  button.disabled = true;
  try {
    const payload = await apiRequest(`${CART_API_URL}/items`, {
      method: "POST",
      body: JSON.stringify({ product_id: Number(button.dataset.addId), quantity: 1 }),
    });
    cart = payload?.data || payload;
    updateCartCount();
    button.textContent = "Adicionado";
  } catch (error) {
    window.alert(error.message);
  } finally {
    button.disabled = false;
    window.setTimeout(() => { if (button.isConnected) button.textContent = "Adicionar"; }, 1100);
  }
});

cartContent.addEventListener("click", async (event) => {
  const button = event.target.closest("[data-cart-action]");
  if (!button) return;
  const item = cart?.items?.find((entry) => String(entry.id) === button.dataset.itemId);
  if (!item) return;
  const action = button.dataset.cartAction;
  const quantity = action === "increase" ? Number(item.quantity) + 1 : action === "decrease" ? Number(item.quantity) - 1 : 0;
  button.disabled = true;
  try {
    const url = `${CART_API_URL}/items/${item.id}`;
    const payload = action === "remove" || quantity === 0
      ? await apiRequest(url, { method: "DELETE" })
      : await apiRequest(url, { method: "PUT", body: JSON.stringify({ quantity }) });
    cart = payload?.data || payload;
    updateCartCount();
    renderCart();
  } catch (error) {
    window.alert(error.message);
    button.disabled = false;
  }
});

document.addEventListener("click", (event) => {
  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) setFilter(filterButton.dataset.filter);
});
cartButton.addEventListener("click", async () => { await loadCart(); cartDialog.showModal(); });
closeCartButton.addEventListener("click", () => cartDialog.close());
cartDialog.addEventListener("click", (event) => { if (event.target === cartDialog) cartDialog.close(); });

// Relógio analógico no fuso de Brasília.
const CLOCK_TIME_ZONE = "America/Sao_Paulo";
const brazilTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: CLOCK_TIME_ZONE, hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23",
});
function getBrazilTime() {
  const now = new Date();
  const parts = brazilTimeFormatter.formatToParts(now);
  const read = (type) => Number(parts.find((part) => part.type === type).value);
  return { hours: read("hour"), minutes: read("minute"), seconds: read("second") + now.getMilliseconds() / 1000 };
}
function tickClock() {
  const time = getBrazilTime();
  const minutes = time.minutes + time.seconds / 60;
  const hours = (time.hours % 12) + minutes / 60;
  document.getElementById("secondHand").style.transform = `rotate(${time.seconds * 6}deg)`;
  document.getElementById("minuteHand").style.transform = `rotate(${minutes * 6}deg)`;
  document.getElementById("hourHand").style.transform = `rotate(${hours * 30}deg)`;
}
function renderDialMarkers() {
  const dial = document.getElementById("heroDial");
  const numberRadius = 26;
  let markup = "";
  for (let hour = 1; hour <= 12; hour++) {
    const degrees = hour * 30;
    const radians = (degrees * Math.PI) / 180;
    const left = 50 + numberRadius * Math.sin(radians);
    const top = 50 - numberRadius * Math.cos(radians);
    const quarterClass = hour % 3 === 0 ? " is-quarter" : "";
    markup += `<span class="baton${quarterClass}" style="--angle:${degrees}deg" aria-hidden="true"></span>`;
    markup += `<span class="dial-number" style="left:${left.toFixed(2)}%;top:${top.toFixed(2)}%" aria-hidden="true">${hour}</span>`;
  }
  dial.insertAdjacentHTML("afterbegin", markup);
}
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
tickClock();
window.setInterval(tickClock, reduceMotion ? 1000 : 100);
renderDialMarkers();
loadProducts();
loadCart();
