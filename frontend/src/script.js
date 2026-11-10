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
const accountButton = document.getElementById("accountButton");
const accountDialog = document.getElementById("accountDialog");
const accountContent = document.getElementById("accountContent");
const closeAccountButton = document.getElementById("closeAccount");
const checkoutButton = document.getElementById("checkoutButton");
const checkoutDialog = document.getElementById("checkoutDialog");
const checkoutContent = document.getElementById("checkoutContent");
const closeCheckoutButton = document.getElementById("closeCheckout");
let currentUser = null;

const formatPrice = (value) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const escapeHtml = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);

function guestToken() { return localStorage.getItem(GUEST_TOKEN_KEY); }
function readCookie(name) {
  const prefix = name + "=";
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null;
}
async function ensureCsrfCookie() {
  const response = await fetch("/sanctum/csrf-cookie", { credentials: "include" });
  if (!response.ok) throw new Error("Não foi possível iniciar a proteção CSRF.");
}
function rememberGuestToken(response) {
  const token = response.headers.get("X-Guest-Token");
  if (token) localStorage.setItem(GUEST_TOKEN_KEY, token);
}

async function apiRequest(url, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!readCookie("XSRF-TOKEN")) await ensureCsrfCookie();
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
  }
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
restoreSession();


async function restoreSession() {
  try {
    currentUser = await apiRequest("/api/user");
    accountButton.textContent = currentUser.name;
  } catch {
    currentUser = null;
    accountButton.textContent = "Entrar";
  }
  await loadCart();
}

function renderAuthForm(mode = "login") {
  if (currentUser) {
    accountContent.innerHTML =
      '<p class="account-greeting">Conectado como <strong>' + escapeHtml(currentUser.email) + '</strong></p>' +
      '<form id="profileForm" class="account-form">' +
      '<label>Nome<input name="name" maxlength="50" required value="' + escapeHtml(currentUser.name) + '"></label>' +
      '<label>E-mail<input name="email" type="email" required value="' + escapeHtml(currentUser.email) + '"></label>' +
      '<button class="add" type="submit">Salvar perfil</button></form>' +
      '<button class="account-link" type="button" id="logoutButton">Sair da conta</button>';
    return;
  }

  const registering = mode === "register";
  accountContent.innerHTML =
    '<form id="' + (registering ? "registerForm" : "loginForm") + '" class="account-form">' +
    (registering ? '<label>Nome<input name="name" maxlength="50" required autocomplete="name"></label>' : '') +
    '<label>E-mail<input name="email" type="email" required autocomplete="email"></label>' +
    '<label>Senha<input name="password" type="password" minlength="8" required autocomplete="' + (registering ? "new-password" : "current-password") + '"></label>' +
    (registering ? '<label>Confirmar senha<input name="password_confirmation" type="password" minlength="8" required autocomplete="new-password"></label>' : '') +
    '<button class="add" type="submit">' + (registering ? "Criar conta" : "Entrar") + '</button></form>' +
    '<button class="account-link" type="button" data-auth-mode="' + (registering ? "login" : "register") + '">' +
    (registering ? "Já tenho uma conta" : "Criar uma conta") + '</button>';
}

async function finishLogin(payload) {
  currentUser = payload.user;
  localStorage.removeItem(GUEST_TOKEN_KEY);
  accountButton.textContent = currentUser.name;
  accountDialog.close();
  await loadCart();
  if (payload.adjustments && payload.adjustments.length) {
    window.alert("Algumas quantidades do carrinho foram ajustadas ao estoque disponível.");
  }
}

accountButton.addEventListener("click", () => {
  renderAuthForm();
  accountDialog.showModal();
});
closeAccountButton.addEventListener("click", () => accountDialog.close());

accountContent.addEventListener("click", async (event) => {
  const modeButton = event.target.closest("[data-auth-mode]");
  if (modeButton) {
    renderAuthForm(modeButton.dataset.authMode);
    return;
  }

  if (event.target.closest("#logoutButton")) {
    try {
      await ensureCsrfCookie();
      await apiRequest("/api/logout", { method: "POST" });
      currentUser = null;
      localStorage.removeItem(GUEST_TOKEN_KEY);
      accountButton.textContent = "Entrar";
      accountDialog.close();
      await loadCart();
    } catch (error) {
      window.alert(error.message);
    }
  }
});

accountContent.addEventListener("submit", async (event) => {
  const form = event.target;
  if (!["loginForm", "registerForm", "profileForm"].includes(form.id)) return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(form).entries());

  try {
    await ensureCsrfCookie();
    if (form.id === "loginForm") {
      const payload = await apiRequest("/api/login", { method: "POST", body: JSON.stringify(data) });
      await finishLogin(payload);
    } else if (form.id === "registerForm") {
      const payload = await apiRequest("/api/register", { method: "POST", body: JSON.stringify(data) });
      await finishLogin(payload);
    } else {
      currentUser = await apiRequest("/api/user", { method: "PUT", body: JSON.stringify(data) });
      accountButton.textContent = currentUser.name;
      renderAuthForm();
      window.alert("Perfil atualizado.");
    }
  } catch (error) {
    window.alert(error.message);
  }
});

async function openCheckout() {
  if (!currentUser) {
    cartDialog.close();
    renderAuthForm();
    accountDialog.showModal();
    window.alert("Entre ou crie uma conta para finalizar o pedido.");
    return;
  }

  try {
    const payload = await apiRequest("/api/addresses");
    const addresses = payload.data || [];
    if (addresses.length) {
      checkoutContent.innerHTML =
        '<form id="existingAddressCheckout" class="account-form"><label>Endereço de entrega<select name="address_id" required>' +
        addresses.map((address) => '<option value="' + address.id + '">' +
          escapeHtml(address.recipient_name) + ' — ' + escapeHtml(address.street) + ', ' +
          escapeHtml(address.number) + ' · ' + escapeHtml(address.city) + '/' + escapeHtml(address.state) +
          '</option>').join("") +
        '</select></label><p class="checkout-shipping">Frete: ' + formatPrice(29.90) +
        '</p><button class="add" type="submit">Confirmar pedido</button></form>' +
        '<button class="account-link" type="button" id="newAddressButton">Cadastrar outro endereço</button>';
    } else {
      renderNewAddressForm();
    }
    checkoutDialog.showModal();
  } catch (error) {
    window.alert(error.message);
  }
}

function renderNewAddressForm() {
  checkoutContent.innerHTML =
    '<form id="newAddressForm" class="account-form">' +
    '<label>Nome do destinatário<input name="recipient_name" required maxlength="100"></label>' +
    '<label>Rua<input name="street" required maxlength="150"></label>' +
    '<label>Número<input name="number" required maxlength="20"></label>' +
    '<label>Complemento<input name="complement" maxlength="100"></label>' +
    '<label>Bairro<input name="neighborhood" required maxlength="100"></label>' +
    '<label>Cidade<input name="city" required maxlength="100"></label>' +
    '<label>Estado (UF)<input name="state" required minlength="2" maxlength="2"></label>' +
    '<label>CEP<input name="cep" required placeholder="12345-678"></label>' +
    '<p class="checkout-shipping">Frete: ' + formatPrice(29.90) + '</p>' +
    '<button class="add" type="submit">Salvar endereço e confirmar pedido</button></form>';
}

async function createOrder(addressId) {
  await ensureCsrfCookie();
  const payload = await apiRequest("/api/orders", {
    method: "POST",
    body: JSON.stringify({ address_id: Number(addressId) }),
  });
  const order = payload.data || payload;
  await loadCart();
  checkoutContent.innerHTML =
    '<div class="order-confirmation"><h3>Pedido #' + order.id + ' criado</h3>' +
    '<p>Total: <strong>' + formatPrice(order.total) + '</strong></p>' +
    '<p>Status: <strong id="checkoutOrderStatus">' + escapeHtml(order.status) + '</strong></p>' +
    '<button class="add" type="button" data-pay-order="' + order.id + '">Confirmar pagamento simulado</button></div>';
}

checkoutButton.addEventListener("click", openCheckout);
closeCheckoutButton.addEventListener("click", () => checkoutDialog.close());

checkoutContent.addEventListener("click", async (event) => {
  if (event.target.closest("#newAddressButton")) {
    renderNewAddressForm();
    return;
  }

  const payButton = event.target.closest("[data-pay-order]");
  if (payButton) {
    try {
      await ensureCsrfCookie();
      const payload = await apiRequest("/api/orders/" + payButton.dataset.payOrder + "/pay", { method: "POST" });
      const order = payload.data || payload;
      document.getElementById("checkoutOrderStatus").textContent = order.status;
      payButton.disabled = true;
      payButton.textContent = "Pagamento registrado";
    } catch (error) {
      window.alert(error.message);
    }
  }
});

checkoutContent.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.target;
  try {
    if (form.id === "existingAddressCheckout") {
      await createOrder(new FormData(form).get("address_id"));
      return;
    }
    if (form.id === "newAddressForm") {
      await ensureCsrfCookie();
      const addressPayload = await apiRequest("/api/addresses", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const address = addressPayload.data || addressPayload;
      await createOrder(address.id);
    }
  } catch (error) {
    window.alert(error.message);
  }
});
