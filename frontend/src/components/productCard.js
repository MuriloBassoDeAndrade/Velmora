import { money, escapeHtml } from "../utils/format.js";

export function productImage(product, className = "") {
  return product.image_url
    ? '<img class="' + className + '" src="' + escapeHtml(product.image_url) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">'
    : '<div class="watch-placeholder ' + className + '" role="img" aria-label="Imagem ilustrativa de ' + escapeHtml(product.name) + '"><span>V</span></div>';
}

export function productCard(product) {
  const unavailable = Number(product.stock) < 1;
  return '<article class="product-card">' +
    '<a class="product-visual" href="/produto/' + product.id + '" data-link>' + productImage(product) +
    (unavailable ? '<span class="stock-pill">Esgotado</span>' : '') + '</a>' +
    '<div class="product-info"><p class="eyebrow">' + escapeHtml(product.brand || product.category?.name || "Velmora") + '</p>' +
    '<h3><a href="/produto/' + product.id + '" data-link>' + escapeHtml(product.name) + '</a></h3>' +
    '<p class="product-category">' + escapeHtml(product.category?.name || "Relógio") + '</p>' +
    '<div class="product-buy"><strong>' + money(product.price) + '</strong><a class="text-link" href="/produto/' + product.id + '" data-link>Ver produto →</a></div></div></article>';
}
