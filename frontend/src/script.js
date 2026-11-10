const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const GUEST_TOKEN_KEY = "velmora_guest_token";
const app = document.getElementById("app");
const cartDialog = document.getElementById("cartDialog");
const accountDialog = document.getElementById("accountDialog");
const cartContent = document.getElementById("cartContent");
const accountContent = document.getElementById("accountContent");
const toastNode = document.getElementById("toast");

let currentUser = null;
let cart = null;
let categories = [];
let characteristics = [];
let toastTimer;

const money = (value) => Number(value ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[char]);
const unwrap = (payload) => payload?.data ?? payload;
const guestToken = () => localStorage.getItem(GUEST_TOKEN_KEY);

function notify(message, type = "success") {
  toastNode.textContent = message;
  toastNode.className = "toast is-visible " + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastNode.classList.remove("is-visible"), 3400);
}
function readCookie(name) {
  const prefix = name + "=";
  const item = document.cookie.split("; ").find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}
async function csrf() {
  const response = await fetch(API_BASE + "/sanctum/csrf-cookie", { credentials: "include" });
  if (!response.ok) throw new Error("Não foi possível iniciar a proteção da sessão.");
}
function rememberGuestToken(response) {
  const token = response.headers.get("X-Guest-Token");
  if (token) localStorage.setItem(GUEST_TOKEN_KEY, token);
}
async function api(path, options = {}) {
  const headers = new Headers(options.headers || {});
  headers.set("Accept", "application/json");
  const isForm = options.body instanceof FormData;
  if (options.body && !isForm) headers.set("Content-Type", "application/json");
  const method = (options.method || "GET").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!readCookie("XSRF-TOKEN")) await csrf();
    const xsrf = readCookie("XSRF-TOKEN");
    if (xsrf) headers.set("X-XSRF-TOKEN", xsrf);
  }
  if (guestToken()) headers.set("X-Guest-Token", guestToken());
  const response = await fetch(API_BASE + path, { ...options, method, headers, credentials: "include" });
  rememberGuestToken(response);
  const type = response.headers.get("content-type") || "";
  const payload = type.includes("application/json") ? await response.json() : null;
  if (!response.ok) {
    const details = payload?.errors ? Object.values(payload.errors).flat().join(" ") : "";
    throw new Error(details || payload?.message || "A solicitação falhou (HTTP " + response.status + ").");
  }
  return payload;
}
function setSessionUI() {
  document.getElementById("accountButton").textContent = currentUser ? currentUser.name : "Entrar";
  document.querySelectorAll("[data-auth-link]").forEach((node) => node.hidden = !currentUser);
  document.querySelectorAll("[data-admin-link]").forEach((node) => node.hidden = !currentUser || currentUser.role !== "admin");
  updateCartCount();
}
function updateCartCount() {
  const count = (cart?.items || []).reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  document.getElementById("cartCount").textContent = String(count);
}
async function loadCart() {
  try {
    cart = unwrap(await api("/api/cart"));
    updateCartCount();
  } catch (error) {
    console.error(error);
  }
}
async function restoreSession() {
  try {
    currentUser = await api("/api/user");
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
  history.pushState({}, "", path);
  renderRoute();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function currentPath() { return window.location.pathname.replace(/\/+$/, "") || "/"; }
function productImage(product, className = "") {
  return product.image_url
    ? '<img class="' + className + '" src="' + esc(product.image_url) + '" alt="' + esc(product.name) + '" loading="lazy">'
    : '<div class="watch-placeholder ' + className + '" role="img" aria-label="Imagem ilustrativa de ' + esc(product.name) + '"><span>V</span></div>';
}
function productCard(product) {
  const unavailable = Number(product.stock) < 1;
  return '<article class="product-card">' +
    '<a class="product-visual" href="/produto/' + product.id + '" data-link>' + productImage(product) +
    (unavailable ? '<span class="stock-pill">Esgotado</span>' : '') + '</a>' +
    '<div class="product-info"><p class="eyebrow">' + esc(product.brand || product.category?.name || "Velmora") + '</p>' +
    '<h3><a href="/produto/' + product.id + '" data-link>' + esc(product.name) + '</a></h3>' +
    '<p class="product-category">' + esc(product.category?.name || "Relógio") + '</p>' +
    '<div class="product-buy"><strong>' + money(product.price) + '</strong><a class="text-link" href="/produto/' + product.id + '" data-link>Ver produto →</a></div></div></article>';
}
async function fetchCategories() {
  const payload = await api("/api/categories");
  categories = unwrap(payload) || [];
  return categories;
}
async function renderHome(params = new URLSearchParams(location.search)) {
  loading("Preparando a seleção de relógios...");
  try {
    await fetchCategories();
    const search = params.get("search") || "";
    const category = params.get("category") || "";
    const sort = params.get("sort") || "recent";
    const page = Number(params.get("page") || 1);
    const query = new URLSearchParams({ sort, page: String(page) });
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    const payload = await api("/api/products?" + query.toString());
    const items = payload.data || [];
    const meta = payload.meta || { current_page: 1, last_page: 1 };
    app.innerHTML = '<section class="hero"><div class="hero-copy"><p class="eyebrow">TEMPO, ESTILO E PRECISÃO</p><h1>O tempo revela<br><em>o que importa.</em></h1><p>Uma curadoria de relógios para acompanhar a sua história.</p><a class="solid-btn" href="#catalogo" data-scroll>Explorar coleção</a></div><div class="hero-art"><div class="hero-orbit"></div><div class="hero-watch"><span>VELMORA</span><i></i><b></b><small>12</small></div><p>DESDE 2026 · CURADORIA DE TEMPO</p></div></section>' +
      '<section class="catalog-section" id="catalogo"><div class="section-heading"><div><p class="eyebrow">NOSSA COLEÇÃO</p><h2>Encontre seu próximo relógio</h2></div><span class="muted">' + (meta.total ?? items.length) + ' produtos</span></div>' +
      '<form id="catalogFilters" class="filters-panel"><label class="search-field"><span>Buscar</span><input name="search" type="search" placeholder="Nome do relógio..." value="' + esc(search) + '"></label>' +
      '<label><span>Categoria</span><select name="category"><option value="">Todas as categorias</option>' + categories.map((c) => '<option value="' + esc(c.slug) + '"' + (category === c.slug ? " selected" : "") + '>' + esc(c.name) + '</option>').join("") + '</select></label>' +
      '<label><span>Ordenar por</span><select name="sort"><option value="recent"' + (sort === "recent" ? " selected" : "") + '>Mais recentes</option><option value="name"' + (sort === "name" ? " selected" : "") + '>Nome</option><option value="price_asc"' + (sort === "price_asc" ? " selected" : "") + '>Menor preço</option><option value="price_desc"' + (sort === "price_desc" ? " selected" : "") + '>Maior preço</option></select></label><button class="solid-btn" type="submit">Aplicar filtros</button></form>' +
      (items.length ? '<div class="product-grid">' + items.map(productCard).join("") + '</div>' : '<div class="empty-state"><p class="eyebrow">BUSCA SEM RESULTADOS</p><h3>Nenhum relógio encontrado</h3><p>Tente outro nome ou selecione uma categoria diferente.</p><button class="outline-btn" data-clear-filters>Limpar filtros</button></div>') +
      (meta.last_page > 1 ? '<nav class="pagination" aria-label="Paginação">' + Array.from({ length: meta.last_page }, (_, i) => i + 1).map((n) => '<button class="' + (n === meta.current_page ? "is-current" : "") + '" data-page="' + n + '">' + n + '</button>').join("") + '</nav>' : '') +
      '</section><section class="trust-strip"><div><strong>Compra consciente</strong><span>Informações claras em cada produto</span></div><div><strong>Estoque atualizado</strong><span>Disponibilidade consultada na API</span></div><div><strong>Pagamento demonstrativo</strong><span>Sem dados de cartão</span></div></section>';
  } catch (error) { errorPage(error); }
}
async function renderProduct(id) {
  loading("Carregando produto...");
  try {
    const product = unwrap(await api("/api/products/" + id));
    const unavailable = !product || !product.active || Number(product.stock) < 1;
    app.innerHTML = '<div class="breadcrumb"><a href="/" data-link>Loja</a><span>/</span><span>' + esc(product.name) + '</span></div>' +
      '<section class="product-detail"><div class="detail-visual">' + productImage(product) + '</div><div class="detail-copy"><p class="eyebrow">' + esc(product.brand) + ' · ' + esc(product.category?.name || "Relógio") + '</p><h1>' + esc(product.name) + '</h1>' +
      '<p class="detail-price">' + money(product.price) + '</p><p class="detail-description">' + esc(product.description || "Um relógio selecionado pela curadoria Velmora.") + '</p>' +
      '<p class="availability ' + (unavailable ? "unavailable" : "") + '">' + (unavailable ? "Indisponível no momento" : "Em estoque · " + product.stock + " unidade(s) disponível(is)") + '</p>' +
      '<form id="addProductForm" class="add-product-form"><input type="hidden" name="product_id" value="' + product.id + '"><label>Quantidade <input name="quantity" type="number" min="1" max="' + Math.max(1, Number(product.stock)) + '" value="1" required ' + (unavailable ? "disabled" : "") + '></label><button class="solid-btn" type="submit" ' + (unavailable ? "disabled" : "") + '>' + (unavailable ? "Produto esgotado" : "Adicionar ao carrinho") + '</button></form>' +
      '<div class="detail-note"><strong>Pagamento simulado</strong><span>Este projeto acadêmico não solicita nem armazena dados de cartão.</span></div></div></section>' +
      (product.characteristics ? '<section class="spec-section"><p class="eyebrow">DETALHES</p><h2>Características</h2><div class="spec-grid">' + Object.entries(product.characteristics).filter(([key, value]) => value && !["id", "created_at", "updated_at"].includes(key)).map(([key, value]) => '<div><span>' + esc(key.replaceAll("_", " ")) + '</span><strong>' + esc(Array.isArray(value) ? value.join(", ") : value) + '</strong></div>').join("") + '</div></section>' : '');
  } catch (error) { errorPage(error); }
}
async function renderOrders() {
  if (!requireAuth()) return;
  loading("Buscando seus pedidos...");
  try {
    const payload = await api("/api/orders");
    const orders = payload.data || [];
    app.innerHTML = '<section class="page-heading"><p class="eyebrow">SUA CONTA</p><h1>Meus pedidos</h1><p>Acompanhe suas compras e consulte os detalhes de cada pedido.</p></section>' +
      (orders.length ? '<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Data</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
      orders.map((order) => '<tr><td>#' + order.id + '</td><td>' + new Date(order.created_at).toLocaleDateString("pt-BR") + '</td><td>' + money(order.total) + '</td><td><span class="status-pill status-' + esc(order.status) + '">' + statusLabel(order.status) + '</span></td><td><a class="text-link" href="/pedido/' + order.id + '" data-link>Ver pedido →</a></td></tr>').join("") +
      '</tbody></table></div>' : '<div class="empty-state"><h3>Você ainda não fez pedidos</h3><p>Quando finalizar uma compra, ela aparecerá aqui.</p><a href="/" data-link class="solid-btn">Explorar relógios</a></div>');
  } catch (error) { errorPage(error); }
}
function statusLabel(status) {
  return ({ pending_payment: "Aguardando pagamento", paid: "Pago", shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado" })[status] || status;
}
async function renderOrder(id) {
  if (!requireAuth()) return;
  loading("Carregando pedido...");
  try {
    const order = unwrap(await api("/api/orders/" + id));
    app.innerHTML = '<div class="breadcrumb"><a href="/pedidos" data-link>Meus pedidos</a><span>/</span><span>Pedido #' + order.id + '</span></div>' +
      '<section class="page-heading"><p class="eyebrow">DETALHES DA COMPRA</p><h1>Pedido #' + order.id + '</h1><p><span class="status-pill status-' + esc(order.status) + '">' + statusLabel(order.status) + '</span> · ' + new Date(order.created_at).toLocaleString("pt-BR") + '</p></section>' +
      '<div class="order-layout"><section class="panel"><h2>Itens do pedido</h2>' + (order.items || []).map((item) => '<div class="order-line"><div><strong>' + esc(item.product_name) + '</strong><span>' + item.quantity + ' × ' + money(item.unit_price) + '</span></div><strong>' + money(item.subtotal) + '</strong></div>').join("") +
      '<div class="summary-line"><span>Subtotal</span><strong>' + money(order.subtotal) + '</strong></div><div class="summary-line"><span>Frete</span><strong>' + money(order.shipping) + '</strong></div><div class="summary-line grand-total"><span>Total</span><strong>' + money(order.total) + '</strong></div>' +
      (order.status === "pending_payment" ? '<div class="action-row"><button class="solid-btn" data-pay="' + order.id + '">Confirmar pagamento simulado</button><button class="outline-btn danger" data-cancel-order="' + order.id + '">Cancelar pedido</button></div><p class="muted">Pagamento acadêmico simulado. Nenhum dado de cartão é utilizado.</p>' : '') +
      (order.payment ? '<p class="success-note">Pagamento registrado em ' + new Date(order.payment.paid_at).toLocaleString("pt-BR") + '.</p>' : '') + '</section>' +
      '<aside class="panel"><h2>Endereço de entrega</h2>' + (order.address ? '<strong>' + esc(order.address.recipient_name) + '</strong><p>' + esc(order.address.street) + ', ' + esc(order.address.number) + (order.address.complement ? ' · ' + esc(order.address.complement) : '') + '</p><p>' + esc(order.address.neighborhood) + ' — ' + esc(order.address.city) + '/' + esc(order.address.state) + '</p><p>CEP ' + esc(order.address.cep) + '</p>' : '<p>Endereço não disponível.</p>') + '</aside></div>';
  } catch (error) { errorPage(error); }
}
function requireAuth() {
  if (currentUser) return true;
  notify("Entre na sua conta para acessar esta página.", "error");
  renderAuthForm();
  accountDialog.showModal();
  return false;
}
async function renderProfile() {
  if (!requireAuth()) return;
  loading("Carregando seu perfil...");
  try {
    const addresses = unwrap(await api("/api/addresses")) || [];
    app.innerHTML = '<section class="page-heading"><p class="eyebrow">SUA CONTA</p><h1>Perfil e endereços</h1><p>Atualize seus dados e mantenha seus endereços de entrega.</p></section>' +
      '<div class="profile-grid"><section class="panel"><h2>Dados pessoais</h2><form id="profileForm" class="form-grid"><label>Nome<input name="name" required maxlength="50" value="' + esc(currentUser.name) + '"></label><label>E-mail<input name="email" type="email" required value="' + esc(currentUser.email) + '"></label><label>Senha atual <small>(necessária para trocar a senha)</small><input name="current_password" type="password" autocomplete="current-password"></label><label>Nova senha<input name="password" type="password" minlength="8" autocomplete="new-password"></label><label>Confirmar nova senha<input name="password_confirmation" type="password" minlength="8" autocomplete="new-password"></label><button class="solid-btn" type="submit">Salvar alterações</button></form></section>' +
      '<section class="panel"><div class="panel-title-row"><h2>Endereços</h2><button class="outline-btn" data-new-address>Adicionar</button></div><div class="address-list">' +
      (addresses.length ? addresses.map(addressCard).join("") : '<p class="muted">Nenhum endereço cadastrado.</p>') + '</div><div id="addressEditor"></div></section></div>';
  } catch (error) { errorPage(error); }
}
function addressCard(address) {
  return '<article class="address-card"><div><strong>' + esc(address.recipient_name) + '</strong><p>' + esc(address.street) + ', ' + esc(address.number) + ' — ' + esc(address.city) + '/' + esc(address.state) + '</p><small>CEP ' + esc(address.cep) + '</small></div><div class="inline-actions"><button class="text-link" data-edit-address="' + address.id + '">Editar</button><button class="text-link danger-text" data-delete-address="' + address.id + '">Excluir</button></div></article>';
}
function addressForm(address = {}) {
  return '<form id="addressForm" class="form-grid compact-form"><input type="hidden" name="id" value="' + (address.id || "") + '">' +
    '<label>Destinatário<input name="recipient_name" required maxlength="100" value="' + esc(address.recipient_name) + '"></label>' +
    '<label>Rua<input name="street" required maxlength="150" value="' + esc(address.street) + '"></label>' +
    '<label>Número<input name="number" required maxlength="20" value="' + esc(address.number) + '"></label>' +
    '<label>Complemento<input name="complement" maxlength="100" value="' + esc(address.complement) + '"></label>' +
    '<label>Bairro<input name="neighborhood" required maxlength="100" value="' + esc(address.neighborhood) + '"></label>' +
    '<label>Cidade<input name="city" required maxlength="100" value="' + esc(address.city) + '"></label>' +
    '<label>Estado (UF)<input name="state" required minlength="2" maxlength="2" value="' + esc(address.state) + '"></label>' +
    '<label>CEP<input name="cep" required placeholder="12345-678" value="' + esc(address.cep) + '"></label>' +
    '<div class="form-actions"><button class="solid-btn" type="submit">Salvar endereço</button><button class="outline-btn" type="button" data-cancel-address>Cancelar</button></div></form>';
}
async function renderAdmin() {
  if (!requireAuth()) return;
  if (currentUser.role !== "admin") { app.innerHTML = '<section class="empty-state"><h1>Acesso restrito</h1><p>Somente administradores podem acessar o painel.</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>'; return; }
  loading("Carregando painel administrativo...");
  try {
    const [productsPayload, categoriesPayload, charsPayload, ordersPayload] = await Promise.all([
      api("/api/admin/products"), api("/api/categories"), api("/api/characteristics"), api("/api/admin/orders"),
    ]);
    const products = productsPayload.data || [];
    categories = unwrap(categoriesPayload) || [];
    characteristics = unwrap(charsPayload) || [];
    const orders = ordersPayload.data || [];
    app.innerHTML = '<section class="page-heading"><p class="eyebrow">GESTÃO DA LOJA</p><h1>Painel administrativo</h1><p>Gerencie catálogo, categorias, estoque e pedidos.</p></section>' +
      '<div class="admin-tabs"><a href="#admin-products">Produtos</a><a href="#admin-categories">Categorias</a><a href="#admin-orders">Pedidos</a></div>' +
      '<section class="panel admin-section" id="admin-products"><div class="panel-title-row"><div><p class="eyebrow">CATÁLOGO</p><h2>Produtos</h2></div><button class="solid-btn" data-new-product>Novo produto</button></div><div id="productEditor"></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead><tbody>' +
      products.map((p) => '<tr><td><strong>' + esc(p.name) + '</strong><small class="table-sub">' + esc(p.brand) + '</small></td><td>' + money(p.price) + '</td><td><form class="stock-form" data-stock-form="' + p.id + '"><input name="stock" type="number" min="0" max="1000000" value="' + p.stock + '" aria-label="Estoque de ' + esc(p.name) + '"><button class="text-link" type="submit">Salvar</button></form></td><td>' + (p.active ? '<span class="status-pill status-active">Ativo</span>' : '<span class="status-pill status-inactive">Inativo</span>') + '</td><td><div class="inline-actions"><button class="text-link" data-edit-product="' + p.id + '">Editar</button><button class="text-link danger-text" data-delete-product="' + p.id + '">Excluir</button></div></td></tr>').join("") +
      '</tbody></table></div></section>' +
      '<section class="panel admin-section" id="admin-categories"><div class="panel-title-row"><div><p class="eyebrow">ORGANIZAÇÃO</p><h2>Categorias</h2></div><button class="outline-btn" data-new-category>Nova categoria</button></div><div id="categoryEditor"></div><div class="category-admin-list">' +
      categories.map((c) => '<article><div><strong>' + esc(c.name) + '</strong><small>' + esc(c.slug) + '</small></div><div class="inline-actions"><button class="text-link" data-edit-category="' + c.id + '">Editar</button><button class="text-link danger-text" data-delete-category="' + c.id + '">Excluir</button></div></article>').join("") + '</div></section>' +
      '<section class="panel admin-section" id="admin-orders"><div class="panel-title-row"><div><p class="eyebrow">VENDAS</p><h2>Pedidos</h2></div><form id="adminOrderFilter"><select name="status"><option value="">Todos os status</option>' + ["pending_payment","paid","shipped","delivered","cancelled"].map((s) => '<option value="' + s + '">' + statusLabel(s) + '</option>').join("") + '</select><button class="outline-btn">Filtrar</button></form></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th><th>Ação</th></tr></thead><tbody>' +
      orders.map((o) => '<tr><td>#' + o.id + '</td><td>' + esc(o.user?.name || o.user?.email || "Cliente") + '</td><td>' + new Date(o.created_at).toLocaleDateString("pt-BR") + '</td><td>' + money(o.total) + '</td><td>' + statusLabel(o.status) + '</td><td>' + (o.status === "paid" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="shipped">Marcar enviado</button>' : o.status === "shipped" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="delivered">Marcar entregue</button>' : '—') + '</td></tr>').join("") +
      '</tbody></table></div></section>';
  } catch (error) { errorPage(error); }
}
function productAdminForm(product = {}) {
  return '<form id="adminProductForm" class="admin-editor" enctype="multipart/form-data"><div class="panel-title-row"><h3>' + (product.id ? "Editar produto #" + product.id : "Cadastrar produto") + '</h3><button type="button" class="icon-btn" data-close-editor="productEditor">×</button></div>' +
    '<input type="hidden" name="id" value="' + (product.id || "") + '">' +
    '<div class="form-grid"><label>Nome<input name="name" required maxlength="255" value="' + esc(product.name) + '"></label><label>Marca<input name="brand" required maxlength="255" value="' + esc(product.brand) + '"></label>' +
    '<label>Preço (R$)<input name="price" type="number" min="0" step="0.01" required value="' + esc(product.price) + '"></label><label>Estoque<input name="stock" type="number" min="0" required value="' + (product.stock ?? 0) + '"></label>' +
    '<label>Categoria<select name="category_id" required><option value="">Selecione</option>' + categories.map((c) => '<option value="' + c.id + '"' + (Number(product.category?.id || product.category_id) === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>').join("") + '</select></label>' +
    '<label>Características<select name="characteristics_id" required><option value="">Selecione</option>' + characteristics.map((c) => '<option value="' + c.id + '"' + (Number(product.characteristics?.id || product.characteristics_id) === c.id ? " selected" : "") + '>#' + c.id + ' · ' + esc(c.gender || c.movement_type || "Características") + '</option>').join("") + '</select></label>' +
    '<label>Imagem do produto (JPG, PNG ou WEBP; até 5 MB)<input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"></label><label>URL de imagem (opcional)<input name="image_url" type="url" value="' + esc(product.image_url) + '"></label>' +
    '<label class="wide">Descrição<textarea name="description" rows="3">' + esc(product.description) + '</textarea></label><label>Status<select name="active"><option value="1"' + (product.active !== false && product.active !== 0 ? " selected" : "") + '>Ativo</option><option value="0"' + (product.active === false || product.active === 0 ? " selected" : "") + '>Inativo</option></select></label></div>' +
    '<div class="form-actions"><button class="solid-btn" type="submit">Salvar produto</button><button class="outline-btn" type="button" data-close-editor="productEditor">Cancelar</button></div></form>';
}
function categoryAdminForm(category = {}) {
  return '<form id="adminCategoryForm" class="admin-editor"><div class="panel-title-row"><h3>' + (category.id ? "Editar categoria" : "Nova categoria") + '</h3><button type="button" class="icon-btn" data-close-editor="categoryEditor">×</button></div><input type="hidden" name="id" value="' + (category.id || "") + '">' +
    '<div class="form-grid"><label>Nome<input name="name" required maxlength="255" value="' + esc(category.name) + '"></label><label>Slug<input name="slug" required maxlength="255" pattern="[a-z0-9-]+" value="' + esc(category.slug) + '"></label></div><div class="form-actions"><button class="solid-btn">Salvar categoria</button><button type="button" class="outline-btn" data-close-editor="categoryEditor">Cancelar</button></div></form>';
}
function createCheckoutDialog() {
  let dialog = document.getElementById("checkoutDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "checkoutDialog";
    dialog.className = "modal";
    dialog.innerHTML = '<div class="modal-head"><h2>Finalizar pedido</h2><button class="icon-btn" data-close="checkoutDialog">×</button></div><div class="modal-body" id="checkoutContent"></div>';
    document.body.append(dialog);
  }
  return dialog;
}
async function openCheckout() {
  if (!requireAuth()) return;
  try {
    const addresses = unwrap(await api("/api/addresses")) || [];
    const dialog = createCheckoutDialog();
    const content = dialog.querySelector("#checkoutContent");
    content.innerHTML = '<p class="muted">O frete fixo é de R$ 29,90. O total será calculado e confirmado pelo servidor.</p>' +
      '<form id="checkoutForm" class="form-grid"><label class="wide">Endereço de entrega<select name="address_id" id="checkoutAddress"><option value="">Cadastrar novo endereço</option>' + addresses.map((a) => '<option value="' + a.id + '">' + esc(a.recipient_name) + ' — ' + esc(a.street) + ', ' + esc(a.number) + ' · ' + esc(a.city) + '/' + esc(a.state) + '</option>').join("") + '</select></label>' +
      '<div id="checkoutNewAddress" class="form-grid wide" ' + (addresses.length ? "hidden" : "") + '>' + addressFieldsMarkup() + '</div><button class="solid-btn wide" type="submit">Criar pedido</button></form>';
    const addressFields = content.querySelector("#checkoutNewAddress");
    const syncAddressFields = () => {
      const useExisting = Boolean(content.querySelector("#checkoutAddress").value);
      addressFields.hidden = useExisting;
      addressFields.querySelectorAll("input").forEach((input) => input.disabled = useExisting);
    };
    content.querySelector("#checkoutAddress").addEventListener("change", syncAddressFields);
    syncAddressFields();
    cartDialog.close();
    dialog.showModal();
  } catch (error) { notify(error.message, "error"); }
}
function addressFieldsMarkup() {
  return '<label>Destinatário<input name="recipient_name" required maxlength="100"></label><label>Rua<input name="street" required maxlength="150"></label><label>Número<input name="number" required maxlength="20"></label><label>Complemento<input name="complement" maxlength="100"></label><label>Bairro<input name="neighborhood" required maxlength="100"></label><label>Cidade<input name="city" required maxlength="100"></label><label>Estado (UF)<input name="state" required minlength="2" maxlength="2"></label><label>CEP<input name="cep" required placeholder="12345-678"></label>';
}
function renderAuthForm(mode = "login") {
  const registering = mode === "register";
  accountContent.innerHTML = '<form id="authForm" class="form-grid">' +
    (registering ? '<label class="wide">Nome<input name="name" required maxlength="50" autocomplete="name"></label>' : '') +
    '<label class="wide">E-mail<input name="email" type="email" required autocomplete="email"></label><label class="wide">Senha<input name="password" type="password" minlength="8" required autocomplete="' + (registering ? "new-password" : "current-password") + '"></label>' +
    (registering ? '<label class="wide">Confirmar senha<input name="password_confirmation" type="password" minlength="8" required></label>' : '') +
    '<button class="solid-btn wide" type="submit">' + (registering ? "Criar conta" : "Entrar") + '</button></form><button class="text-link auth-switch" data-auth-mode="' + (registering ? "login" : "register") + '">' + (registering ? "Já tenho uma conta" : "Ainda não tenho conta") + '</button>';
}
async function finishLogin(payload) {
  currentUser = payload.user;
  localStorage.removeItem(GUEST_TOKEN_KEY);
  cart = payload.cart || cart;
  setSessionUI();
  accountDialog.close();
  await loadCart();
  if (payload.adjustments?.length) notify("Algumas quantidades foram ajustadas ao estoque disponível.");
  const intended = sessionStorage.getItem("velmora_after_login");
  sessionStorage.removeItem("velmora_after_login");
  if (intended) navigate(intended);
  else notify("Bem-vindo à Velmora!");
}
async function openCart() {
  await loadCart();
  const items = cart?.items || [];
  cartContent.innerHTML = items.length ? items.map((item) => {
    const product = item.product;
    const unavailable = item.unavailable || !product;
    return '<article class="cart-item">' + productImage(product || {}, "cart-thumb") + '<div class="cart-item-main"><strong>' + esc(product?.name || "Produto indisponível") + '</strong><span>' + money(product?.price) + ' · Subtotal ' + money(item.subtotal) + '</span>' +
      (unavailable ? '<small class="danger-text">Produto indisponível.</small>' : item.exceeds_stock ? '<small class="danger-text">Quantidade acima do estoque.</small>' : '') +
      '<div class="quantity-control"><button data-cart-change="minus" data-item="' + item.id + '">−</button><span>' + item.quantity + '</span><button data-cart-change="plus" data-item="' + item.id + '" ' + (unavailable ? "disabled" : "") + '>+</button><button class="text-link danger-text" data-cart-change="remove" data-item="' + item.id + '">Remover</button></div></div></article>';
  }).join("") : '<div class="empty-state"><h3>Seu carrinho está vazio</h3><p>Adicione um relógio para começar.</p></div>';
  document.getElementById("cartTotal").textContent = money(cart?.total || 0);
  document.getElementById("checkoutButton").disabled = !items.length;
  cartDialog.showModal();
}
document.addEventListener("click", async (event) => {
  const link = event.target.closest("a[data-link]");
  if (link && link.origin === location.origin) {
    event.preventDefault();
    navigate(link.pathname + link.search + link.hash);
    return;
  }
  const close = event.target.closest("[data-close]");
  if (close) document.getElementById(close.dataset.close)?.close();
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) renderAuthForm(authMode.dataset.authMode);
  if (event.target.closest("[data-clear-filters]")) navigate("/");
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    const params = new URLSearchParams(location.search);
    params.set("page", pageButton.dataset.page);
    navigate("/?" + params.toString());
  }
  const addButton = event.target.closest("[data-add-product]");
  if (addButton) {
    try {
      const form = document.getElementById("addProductForm");
      const data = Object.fromEntries(new FormData(form).entries());
      cart = unwrap(await api("/api/cart/items", { method: "POST", body: JSON.stringify({ product_id: Number(data.product_id), quantity: Number(data.quantity) }) }));
      updateCartCount(); notify("Produto adicionado ao carrinho.");
    } catch (error) { notify(error.message, "error"); }
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
        ? await api("/api/cart/items/" + id, { method: "DELETE" })
        : await api("/api/cart/items/" + id, { method: "PUT", body: JSON.stringify({ quantity }) });
      cart = unwrap(result); await openCart(); updateCartCount();
    } catch (error) { notify(error.message, "error"); }
  }
  const pay = event.target.closest("[data-pay]");
  if (pay) {
    try { await api("/api/orders/" + pay.dataset.pay + "/pay", { method: "POST" }); notify("Pagamento simulado registrado."); renderOrder(pay.dataset.pay); }
    catch (error) { notify(error.message, "error"); }
  }
  const cancel = event.target.closest("[data-cancel-order]");
  if (cancel && confirm("Deseja cancelar este pedido? O estoque será devolvido.")) {
    try { await api("/api/orders/" + cancel.dataset.cancelOrder + "/cancel", { method: "POST" }); notify("Pedido cancelado."); renderOrder(cancel.dataset.cancelOrder); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-new-address]")) document.getElementById("addressEditor").innerHTML = addressForm();
  const editAddress = event.target.closest("[data-edit-address]");
  if (editAddress) {
    try { const list = unwrap(await api("/api/addresses")); const address = list.find((a) => a.id === Number(editAddress.dataset.editAddress)); document.getElementById("addressEditor").innerHTML = addressForm(address); }
    catch (error) { notify(error.message, "error"); }
  }
  const deleteAddress = event.target.closest("[data-delete-address]");
  if (deleteAddress && confirm("Excluir este endereço?")) {
    try { await api("/api/addresses/" + deleteAddress.dataset.deleteAddress, { method: "DELETE" }); notify("Endereço excluído."); renderProfile(); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-cancel-address]")) document.getElementById("addressEditor").innerHTML = "";
  if (event.target.closest("[data-new-product]")) document.getElementById("productEditor").innerHTML = productAdminForm();
  const editProduct = event.target.closest("[data-edit-product]");
  if (editProduct) {
    try { const product = unwrap(await api("/api/admin/products/" + editProduct.dataset.editProduct)); document.getElementById("productEditor").innerHTML = productAdminForm(product); }
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
    try { await api("/api/products/" + deleteProduct.dataset.deleteProduct, { method: "DELETE" }); notify("Produto excluído."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
  const deleteCategory = event.target.closest("[data-delete-category]");
  if (deleteCategory && confirm("Excluir esta categoria?")) {
    try { await api("/api/categories/" + deleteCategory.dataset.deleteCategory, { method: "DELETE" }); notify("Categoria excluída."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
  const orderStatus = event.target.closest("[data-order-status]");
  if (orderStatus) {
    try { await api("/api/admin/orders/" + orderStatus.dataset.orderStatus + "/status", { method: "PATCH", body: JSON.stringify({ status: orderStatus.dataset.nextStatus }) }); notify("Status do pedido atualizado."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
});
document.getElementById("accountContent").addEventListener("click", async (event) => {
  if (event.target.closest("#logoutButton")) {
    try { await api("/api/logout", { method: "POST" }); currentUser = null; localStorage.removeItem(GUEST_TOKEN_KEY); setSessionUI(); accountDialog.close(); await loadCart(); notify("Sessão encerrada."); if (currentPath() !== "/") navigate("/"); }
    catch (error) { notify(error.message, "error"); }
  }
});
document.getElementById("accountContent").addEventListener("submit", async (event) => {
  if (event.target.id !== "authForm") return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  try {
    const isRegister = Boolean(data.name);
    const payload = await api(isRegister ? "/api/register" : "/api/login", { method: "POST", body: JSON.stringify(data) });
    await finishLogin(payload);
  } catch (error) { notify(error.message, "error"); }
});
app.addEventListener("submit", async (event) => {
  const form = event.target;
  event.preventDefault();
  try {
    if (form.id === "catalogFilters") {
      const data = Object.fromEntries(new FormData(form).entries());
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => { if (value) params.set(key, value); });
      navigate("/" + (params.toString() ? "?" + params.toString() : ""));
    } else if (form.id === "addProductForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      cart = unwrap(await api("/api/cart/items", { method: "POST", body: JSON.stringify({ product_id: Number(data.product_id), quantity: Number(data.quantity) }) }));
      updateCartCount(); notify("Produto adicionado ao carrinho.");
    } else if (form.id === "checkoutForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      let addressId = data.address_id;
      if (!addressId) {
        const addressData = Object.fromEntries(new FormData(form).entries());
        delete addressData.address_id;
        const address = unwrap(await api("/api/addresses", { method: "POST", body: JSON.stringify(addressData) }));
        addressId = address.id;
      }
      const order = unwrap(await api("/api/orders", { method: "POST", body: JSON.stringify({ address_id: Number(addressId) }) }));
      document.getElementById("checkoutDialog").close();
      await loadCart(); notify("Pedido criado. Confirme o pagamento simulado.");
      navigate("/pedido/" + order.id);
    } else if (form.id === "profileForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      Object.keys(data).forEach((key) => { if (!data[key]) delete data[key]; });
      currentUser = await api("/api/user", { method: "PUT", body: JSON.stringify(data) });
      setSessionUI(); notify("Perfil atualizado."); renderProfile();
    } else if (form.id === "addressForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      const id = data.id; delete data.id;
      await api(id ? "/api/addresses/" + id : "/api/addresses", { method: id ? "PUT" : "POST", body: JSON.stringify(data) });
      notify("Endereço salvo."); renderProfile();
    } else if (form.id === "adminProductForm") {
      const formData = new FormData(form);
      const id = formData.get("id");
      formData.delete("id");
      if (id) formData.append("_method", "PUT");
      await api(id ? "/api/products/" + id : "/api/products", { method: "POST", body: formData });
      notify("Produto salvo."); renderAdmin();
    } else if (form.id === "adminCategoryForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      const id = data.id; delete data.id;
      await api(id ? "/api/categories/" + id : "/api/categories", { method: id ? "PUT" : "POST", body: JSON.stringify(data) });
      notify("Categoria salva."); renderAdmin();
    } else if (form.matches("[data-stock-form]")) {
      const data = Object.fromEntries(new FormData(form).entries());
      await api("/api/admin/products/" + form.dataset.stockForm + "/stock", { method: "PATCH", body: JSON.stringify({ stock: Number(data.stock) }) });
      notify("Estoque atualizado.");
    } else if (form.id === "adminOrderFilter") {
      const status = new FormData(form).get("status");
      const payload = await api("/api/admin/orders" + (status ? "?status=" + encodeURIComponent(status) : ""));
      const rows = payload.data || [];
      const tbody = document.querySelector("#admin-orders tbody");
      if (tbody) tbody.innerHTML = rows.map((o) => '<tr><td>#' + o.id + '</td><td>' + esc(o.user?.name || o.user?.email || "Cliente") + '</td><td>' + new Date(o.created_at).toLocaleDateString("pt-BR") + '</td><td>' + money(o.total) + '</td><td>' + statusLabel(o.status) + '</td><td>' + (o.status === "paid" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="shipped">Marcar enviado</button>' : o.status === "shipped" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="delivered">Marcar entregue</button>' : "—") + '</td></tr>').join("");
    }
  } catch (error) { notify(error.message, "error"); }
});
window.addEventListener("popstate", renderRoute);
async function renderRoute() {
  const path = currentPath();
  if (path === "/") return renderHome(new URLSearchParams(location.search));
  if (path.startsWith("/produto/")) return renderProduct(path.split("/")[2]);
  if (path === "/pedidos") return renderOrders();
  if (path.startsWith("/pedido/")) return renderOrder(path.split("/")[2]);
  if (path === "/perfil") return renderProfile();
  if (path === "/admin") return renderAdmin();
  app.innerHTML = '<section class="empty-state"><p class="eyebrow">404</p><h1>Página não encontrada</h1><p>O endereço acessado não existe.</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>';
}
document.getElementById("checkoutButton").addEventListener("click", openCheckout);
document.getElementById("cartButton").addEventListener("click", openCart);
document.getElementById("accountButton").addEventListener("click", () => { renderAuthForm(); accountDialog.showModal(); });
document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", () => document.getElementById(button.dataset.close)?.close()));
restoreSession().then(renderRoute);
