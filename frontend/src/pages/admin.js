export async function renderAdmin(ctx) {
  const { requireAuth, currentUser, app, loading, adminApi, productApi, unwrap, esc, money, statusLabel, errorPage } = ctx;
  let { categories, characteristics } = ctx;
  if (!requireAuth()) return;
  if (currentUser.role !== "admin") { app.innerHTML = '<section class="empty-state"><h1>Acesso restrito</h1><p>Somente administradores podem acessar o painel.</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>'; return; }
  loading("Carregando painel administrativo...");
  try {
    const [productsPayload, categoriesPayload, charsPayload, ordersPayload] = await Promise.all([
      adminApi.listAdminProducts(), productApi.listCategories(), adminApi.listCharacteristics(), adminApi.listAdminOrders(),
    ]);
    const products = productsPayload.data || [];
    categories = unwrap(categoriesPayload) || []; ctx.categories = categories;
    characteristics = unwrap(charsPayload) || []; ctx.characteristics = characteristics;
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

export function productAdminForm(ctx, product = {}) {
  const { esc, categories, characteristics } = ctx;
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

export function categoryAdminForm(ctx, category = {}) {
  const { esc } = ctx;
  return '<form id="adminCategoryForm" class="admin-editor"><div class="panel-title-row"><h3>' + (category.id ? "Editar categoria" : "Nova categoria") + '</h3><button type="button" class="icon-btn" data-close-editor="categoryEditor">×</button></div><input type="hidden" name="id" value="' + (category.id || "") + '">' +
    '<div class="form-grid"><label>Nome<input name="name" required maxlength="255" value="' + esc(category.name) + '"></label><label>Slug<input name="slug" required maxlength="255" pattern="[a-z0-9-]+" value="' + esc(category.slug) + '"></label></div><div class="form-actions"><button class="solid-btn">Salvar categoria</button><button type="button" class="outline-btn" data-close-editor="categoryEditor">Cancelar</button></div></form>';
}
