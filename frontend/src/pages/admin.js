import { date } from "../utils/format.js";

export async function renderAdmin(ctx) {
  const { requireAuth, currentUser, app, loading, adminApi, productApi, productImage, unwrap, esc, money, statusLabel, errorPage } = ctx;
  let { categories } = ctx;
  if (!requireAuth()) return;
  if (currentUser.role !== "admin") { app.innerHTML = '<section class="empty-state"><h1>Acesso restrito</h1><p>Somente administradores podem acessar o painel.</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>'; return; }
  loading("Carregando painel administrativo...");
  try {
    const params = new URLSearchParams(location.search);
    const productPage = parsePage(params.get("admin_products_page"));
    const orderPage = parsePage(params.get("admin_orders_page"));
    const orderStatus = params.get("admin_order_status") || "";
    const [productsPayload, categoriesPayload, ordersPayload] = await Promise.all([
      adminApi.listAdminProducts({ page: productPage }),
      productApi.listCategories(),
      adminApi.listAdminOrders({ page: orderPage, ...(orderStatus ? { status: orderStatus } : {}) }),
    ]);
    const adjustedParams = new URLSearchParams(location.search);
    if (productPage > Number(productsPayload.meta?.last_page) && Number(productsPayload.meta?.last_page) > 0) {
      adjustedParams.set("admin_products_page", String(productsPayload.meta.last_page));
    }
    if (orderPage > Number(ordersPayload.meta?.last_page) && Number(ordersPayload.meta?.last_page) > 0) {
      adjustedParams.set("admin_orders_page", String(ordersPayload.meta.last_page));
    }
    if (adjustedParams.toString() !== params.toString()) {
      const query = adjustedParams.toString();
      history.replaceState({}, "", location.pathname + (query ? "?" + query : "") + location.hash);
      return renderAdmin(ctx);
    }
    const products = productsPayload.data || [];
    categories = unwrap(categoriesPayload) || []; ctx.categories = categories;
    const orders = ordersPayload.data || [];
    app.innerHTML = '<section class="page-heading"><p class="eyebrow">GESTÃO DA LOJA</p><h1>Painel administrativo</h1><p>Gerencie catálogo, categorias, estoque e pedidos.</p></section>' +
      '<nav class="admin-tabs" aria-label="Seções do painel"><a href="#admin-products">Produtos</a><a href="#admin-categories">Categorias</a><a href="#admin-orders">Pedidos</a></nav>' +
      '<section class="panel admin-section" id="admin-products"><div class="panel-title-row"><div><p class="eyebrow">CATÁLOGO</p><h2>Produtos</h2></div><button class="solid-btn" data-new-product>Novo produto</button></div><div id="productEditor"></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Produto</th><th>Preço</th><th>Estoque</th><th>Status</th><th>Ações</th></tr></thead><tbody>' +
      products.map((p) => '<tr><td><div class="admin-product-cell">' + productImage(p, "admin-product-thumb") + '<div><strong>' + esc(p.name) + '</strong><small class="table-sub">' + esc(p.brand) + '</small></div></div></td><td>' + money(p.price) + '</td><td><form class="stock-form" data-stock-form="' + p.id + '"><input name="stock" type="number" min="0" max="1000000" value="' + p.stock + '" aria-label="Estoque de ' + esc(p.name) + '"><button class="text-link" type="submit">Salvar</button></form></td><td>' + (p.active ? '<span class="status-pill status-active">Ativo</span>' : '<span class="status-pill status-inactive">Inativo</span>') + '</td><td><div class="inline-actions"><button class="text-link" data-edit-product="' + p.id + '">Editar</button><button class="text-link danger-text" data-delete-product="' + p.id + '">Excluir</button></div></td></tr>').join("") +
      '</tbody></table></div>' + adminPagination("products", productsPayload.meta) + '</section>' +
      '<section class="panel admin-section" id="admin-categories"><div class="panel-title-row"><div><p class="eyebrow">ORGANIZAÇÃO</p><h2>Categorias</h2></div><button class="outline-btn" data-new-category>Nova categoria</button></div><div id="categoryEditor"></div><div class="category-admin-list">' +
      categories.map((c) => '<article><div><strong>' + esc(c.name) + '</strong><small>' + esc(c.slug) + '</small></div><div class="inline-actions"><button class="text-link" data-edit-category="' + c.id + '">Editar</button><button class="text-link danger-text" data-delete-category="' + c.id + '">Excluir</button></div></article>').join("") + '</div></section>' +
      '<section class="panel admin-section" id="admin-orders"><div class="panel-title-row"><div><p class="eyebrow">VENDAS</p><h2>Pedidos</h2></div><form id="adminOrderFilter"><select name="status"><option value="">Todos os status</option>' + ["pending_payment","paid","shipped","delivered","cancelled"].map((s) => '<option value="' + s + '"' + (orderStatus === s ? " selected" : "") + '>' + statusLabel(s) + '</option>').join("") + '</select><button class="outline-btn">Filtrar</button></form></div>' +
      '<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Cliente</th><th>Data</th><th>Total</th><th>Status</th><th>Ação</th></tr></thead><tbody>' +
      orders.map((o) => '<tr><td>#' + o.id + '</td><td>' + esc(o.user?.name || o.user?.email || "Cliente") + '</td><td>' + date(o.created_at) + '</td><td>' + money(o.total) + '</td><td>' + statusLabel(o.status) + '</td><td>' + (o.status === "paid" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="shipped">Marcar enviado</button>' : o.status === "shipped" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="delivered">Marcar entregue</button>' : '—') + '</td></tr>').join("") +
      '</tbody></table></div>' + adminPagination("orders", ordersPayload.meta) + '</section>';
    const initialSection = location.hash.startsWith("#admin-")
      ? document.getElementById(location.hash.slice(1))
      : null;
    if (initialSection) initialSection.scrollIntoView({ block: "start" });
  } catch (error) { errorPage(error); }
}

function parsePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

function adminPagination(section, meta = {}) {
  const currentPage = Number(meta.current_page) || 1;
  const lastPage = Number(meta.last_page) || 1;
  const total = Number(meta.total) || 0;
  const from = Number(meta.from) || 0;
  const to = Number(meta.to) || 0;
  const summary = total
    ? 'Exibindo ' + from + '–' + to + ' de ' + total
    : 'Nenhum registro';
  if (lastPage <= 1) return '<p class="admin-pagination-summary">' + summary + '</p>';

  const pages = new Set([1, lastPage]);
  for (let page = Math.max(1, currentPage - 1); page <= Math.min(lastPage, currentPage + 1); page++) {
    pages.add(page);
  }
  const sortedPages = [...pages].sort((a, b) => a - b);
  let previousPage = 0;
  const pageButtons = sortedPages.map((page) => {
    const gap = page - previousPage > 1 ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>' : '';
    previousPage = page;
    return gap + '<button type="button" class="' + (page === currentPage ? "is-current" : "") + '" data-admin-page="' + section + '" data-page="' + page + '"' + (page === currentPage ? ' aria-current="page"' : '') + '>' + page + '</button>';
  }).join("");

  return '<div class="admin-pagination-row"><p class="admin-pagination-summary">' + summary + '</p><nav class="pagination admin-pagination" aria-label="Paginação de ' + (section === "products" ? "produtos" : "pedidos") + '">' +
    '<button type="button" data-admin-page="' + section + '" data-page="' + (currentPage - 1) + '" aria-label="Página anterior"' + (currentPage <= 1 ? " disabled" : "") + '>Anterior</button>' +
    pageButtons +
    '<button type="button" data-admin-page="' + section + '" data-page="' + (currentPage + 1) + '" aria-label="Próxima página"' + (currentPage >= lastPage ? " disabled" : "") + '>Próxima</button>' +
    '</nav></div>';
}

export function productAdminForm(ctx, product = {}) {
  const { esc, categories, productImage } = ctx;
  const characteristicFields = [
    ["gender", "Gênero"],
    ["case_shape", "Formato da caixa"],
    ["movement_type", "Tipo de movimento"],
    ["module_caliber_movement_number", "Módulo, calibre ou número do movimento"],
    ["size_perception", "Percepção de tamanho"],
    ["case_material", "Material da caixa"],
    ["main_watch_color", "Cor principal do relógio"],
    ["strap_color", "Cor da pulseira"],
    ["dial_color", "Cor do mostrador"],
    ["strap_type", "Tipo de pulseira"],
    ["dial_style", "Estilo do mostrador"],
    ["crystal_type", "Tipo de cristal"],
    ["crown_and_caseback_type", "Coroa e tipo de fundo"],
    ["functions", "Funções"],
    ["water_resistance", "Resistência à água"],
    ["warranty", "Garantia"],
    ["illumination_type", "Tipo de iluminação"],
    ["watch_dimensions", "Dimensões do relógio"],
    ["dial_dimensions", "Dimensões do mostrador"],
    ["thickness", "Espessura"],
    ["weight", "Peso"],
    ["strap_lug_width", "Largura entre as asas"],
  ];
  const textareas = new Set(["crown_and_caseback_type", "functions"]);
  return '<form id="adminProductForm" class="admin-editor" enctype="multipart/form-data"><div class="panel-title-row"><h3>' + (product.id ? "Editar produto #" + product.id : "Cadastrar produto") + '</h3><button type="button" class="icon-btn" data-close-editor="productEditor">×</button></div>' +
    '<input type="hidden" name="id" value="' + (product.id || "") + '">' +
    '<div class="admin-product-layout"><div class="admin-image-field"><div class="admin-product-preview" data-product-image-preview>' + productImage(product, "admin-product-preview-image") + '</div><label>Imagem do produto (JPG, PNG ou WEBP; até 5 MB)<input name="image" type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" aria-describedby="productImageHelp"></label><p class="muted" id="productImageHelp">' + (product.image_url ? "Imagem atual. Escolha um arquivo para substituí-la." : "Nenhuma imagem enviada. Escolha um arquivo para adicioná-la.") + '</p></div>' +
    '<div class="admin-product-details form-grid"><label>Nome<input name="name" required maxlength="255" value="' + esc(product.name) + '"></label><label>Marca<input name="brand" required maxlength="255" value="' + esc(product.brand) + '"></label>' +
    '<label>Preço (R$)<input name="price" type="number" min="0" step="0.01" required value="' + esc(product.price) + '"></label><label>Estoque<input name="stock" type="number" min="0" required value="' + (product.stock ?? 0) + '"></label>' +
    '<label>Categoria<select name="category_id" required><option value="">Selecione</option>' + categories.map((c) => '<option value="' + c.id + '"' + (Number(product.category?.id || product.category_id) === c.id ? " selected" : "") + '>' + esc(c.name) + '</option>').join("") + '</select></label>' +
    '<label>Status<select name="active"><option value="1"' + (product.active !== false && product.active !== 0 ? " selected" : "") + '>Ativo</option><option value="0"' + (product.active === false || product.active === 0 ? " selected" : "") + '>Inativo</option></select></label>' +
    '<label class="wide">Descrição<textarea name="description" rows="3">' + esc(product.description) + '</textarea></label></div></div>' +
    '<section class="admin-characteristics wide"><div><p class="eyebrow">ESPECIFICAÇÕES</p><h4>Características do relógio</h4></div><div class="form-grid">' +
    characteristicFields.map(([name, label]) => '<label>' + label + (name === "gender"
      ? '<select name="characteristics[gender]" required><option value="Masculino"' + (product.characteristics?.gender === "Masculino" ? " selected" : "") + '>Masculino</option><option value="Feminino"' + (product.characteristics?.gender === "Feminino" ? " selected" : "") + '>Feminino</option><option value="Unissex"' + (product.characteristics?.gender === "Unissex" ? " selected" : "") + '>Unissex</option></select>'
      : textareas.has(name)
        ? '<textarea name="characteristics[' + name + ']" rows="2" required>' + esc(product.characteristics?.[name]) + '</textarea>'
        : '<input name="characteristics[' + name + ']" required maxlength="255" value="' + esc(product.characteristics?.[name]) + '">') + '</label>').join("") +
    '</div></section>' +
    '<div class="form-actions"><button class="solid-btn" type="submit">Salvar produto</button><button class="outline-btn" type="button" data-close-editor="productEditor">Cancelar</button></div></form>';
}

export function categoryAdminForm(ctx, category = {}) {
  const { esc } = ctx;
  return '<form id="adminCategoryForm" class="admin-editor"><div class="panel-title-row"><h3>' + (category.id ? "Editar categoria" : "Nova categoria") + '</h3><button type="button" class="icon-btn" data-close-editor="categoryEditor">×</button></div><input type="hidden" name="id" value="' + (category.id || "") + '">' +
    '<div class="form-grid"><label>Nome<input name="name" required maxlength="255" value="' + esc(category.name) + '"></label><label>Slug<input name="slug" required maxlength="255" pattern="[a-z0-9-]+" value="' + esc(category.slug) + '"></label></div><div class="form-actions"><button class="solid-btn">Salvar categoria</button><button type="button" class="outline-btn" data-close-editor="categoryEditor">Cancelar</button></div></form>';
}
