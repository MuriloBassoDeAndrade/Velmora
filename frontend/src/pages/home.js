let clockTimer;

export async function renderHome(ctx, params = new URLSearchParams(location.search)) {
  const { app, loading, fetchCategories, productApi, esc, productCard, errorPage } = ctx;
  loading("Preparando a seleção de relógios...");
  try {
    const searchParams = params instanceof URLSearchParams ? params : new URLSearchParams(params);
    await fetchCategories();
    const categories = ctx.categories;
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const gender = searchParams.get("gender") || "";
    const isNewArrivals = searchParams.get("new") === "1";
    const sort = searchParams.get("sort") || "recent";
    const heading = gender === "Masculino" ? "Relógios masculinos" :
      gender === "Feminino" ? "Relógios femininos" :
        isNewArrivals ? "Novidades" : "Encontre seu próximo relógio";
    const requestedPage = Number(searchParams.get("page"));
    const page = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
    const query = new URLSearchParams({ sort, page: String(page) });
    if (search) query.set("search", search);
    if (category) query.set("category", category);
    if (gender) query.set("gender", gender);
    const payload = await productApi.listProducts(Object.fromEntries(query.entries()));
    const items = payload.data || [];
    const meta = payload.meta || { current_page: 1, last_page: 1 };
    app.innerHTML = (!gender && !isNewArrivals ? '<section class="hero"><div class="hero-copy"><p class="eyebrow">TEMPO, ESTILO E PRECISÃO</p><h1>O tempo revela<br><em>o que importa.</em></h1><p>Uma curadoria de relógios para acompanhar a sua história.</p></div><div class="hero-art"><div class="hero-orbit"></div><div class="hero-watch" role="img" aria-label="Relógio analógico mostrando o horário local"><div class="hero-strap"></div><div class="hero-case"><div class="hero-dial"><span class="hero-marker hero-marker-12">12</span><span class="hero-marker hero-marker-3">3</span><span class="hero-marker hero-marker-6">6</span><span class="hero-marker hero-marker-9">9</span><span class="hero-brand">VELMORA</span><i class="hero-hand hero-hand-hour"></i><i class="hero-hand hero-hand-minute"></i><i class="hero-hand hero-hand-second"></i><span class="hero-pin"></span></div></div><span class="hero-crown"></span></div><div class="hero-local-time"><span>HORA LOCAL</span><time class="hero-clock-time">--:--:--</time></div><p>PRECISÃO NO SEU TEMPO</p></div></section>' : '') +
      '<section class="catalog-section" id="catalogo"><div class="section-heading"><div><p class="eyebrow">NOSSA COLEÇÃO</p><h2>' + heading + '</h2></div><span class="muted">' + (meta.total ?? items.length) + ' produtos</span></div>' +
      '<form id="catalogFilters" class="filters-panel">' + (gender ? '<input type="hidden" name="gender" value="' + esc(gender) + '">' : '') + (isNewArrivals ? '<input type="hidden" name="new" value="1">' : '') + '<label class="search-field"><span>Buscar</span><input name="search" type="search" placeholder="Nome do relógio..." value="' + esc(search) + '"></label>' +
      '<label><span>Categoria</span><select name="category"><option value="">Todas as categorias</option>' + categories.map((c) => '<option value="' + esc(c.slug) + '"' + (category === c.slug ? " selected" : "") + '>' + esc(c.name) + '</option>').join("") + '</select></label>' +
      '<label><span>Ordenar por</span><select name="sort"><option value="recent"' + (sort === "recent" ? " selected" : "") + '>Mais recentes</option><option value="name"' + (sort === "name" ? " selected" : "") + '>Nome</option><option value="price_asc"' + (sort === "price_asc" ? " selected" : "") + '>Menor preço</option><option value="price_desc"' + (sort === "price_desc" ? " selected" : "") + '>Maior preço</option></select></label><button class="solid-btn" type="submit">Aplicar filtros</button></form>' +
      (items.length ? '<div class="product-grid">' + items.map(productCard).join("") + '</div>' : '<div class="empty-state"><p class="eyebrow">BUSCA SEM RESULTADOS</p><h3>Nenhum relógio encontrado</h3><p>Tente outro nome ou selecione uma categoria diferente.</p><button class="outline-btn" data-clear-filters>Limpar filtros</button></div>') +
      (meta.last_page > 1 ? '<nav class="pagination" aria-label="Paginação">' + Array.from({ length: meta.last_page }, (_, i) => i + 1).map((n) => '<button class="' + (n === meta.current_page ? "is-current" : "") + '" data-page="' + n + '">' + n + '</button>').join("") + '</nav>' : '') +
      '</section>';
    startLocalClock();
  } catch (error) { errorPage(error); }
}

function startLocalClock() {
  clearInterval(clockTimer);

  const updateClock = () => {
    const watch = document.querySelector(".hero-watch");
    const time = document.querySelector(".hero-clock-time");
    if (!watch || !time) {
      clearInterval(clockTimer);
      clockTimer = undefined;
      return;
    }

    const now = new Date();
    const hours = now.getHours() % 12;
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    watch.style.setProperty("--hour-angle", (hours * 30 + minutes * 0.5) + "deg");
    watch.style.setProperty("--minute-angle", (minutes * 6 + seconds * 0.1) + "deg");
    watch.style.setProperty("--second-angle", (seconds * 6) + "deg");
    time.dateTime = now.toISOString();
    time.textContent = now.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    watch.setAttribute("aria-label", "Relógio mostrando o horário local: " + time.textContent);
  };

  updateClock();
  clockTimer = window.setInterval(updateClock, 1000);
}
