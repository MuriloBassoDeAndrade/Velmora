export async function renderHome(params = new URLSearchParams(location.search)) { {
  const { app, loading, fetchCategories, productApi, categories, esc, productCard, errorPage } = ctx;
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
    const payload = await productApi.listProducts(Object.fromEntries(query.entries()));
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
