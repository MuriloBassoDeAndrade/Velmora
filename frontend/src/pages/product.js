export async function renderProduct(id) { {
  const { app, loading, unwrap, productApi, esc, productImage, money, errorPage } = ctx;
  loading("Carregando produto...");
  try {
    const product = unwrap(await productApi.getProduct(id));
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
