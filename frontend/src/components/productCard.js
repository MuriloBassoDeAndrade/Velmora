import { money, escapeHtml } from "../utils/format.js";

let illustrationCount = 0;

function watchIllustration(product, id) {
  const strapGradient = "watch-strap-" + id;
  const caseGradient = "watch-case-" + id;
  const dialGradient = "watch-dial-" + id;
  const details = [
    product.name,
    product.description,
    product.category?.name,
    ...Object.values(product.characteristics || {}),
  ].join(" ").toLocaleLowerCase("pt-BR");
  const isHybrid = /anal[oó]gico.digital|ga-100|ga-2100/i.test(details);
  const isDigital = /digital|la680|dw-5600|dw-6900/i.test(details) && !isHybrid;
  const isDiver = /mergulho|diver/i.test(details);
  const isOctagonal = /ga-2100|octagonal/i.test(details);
  const isSquare = /retangular|quadrad[oa]|rectangle|square|la680/i.test(details);
  const isMetal = /pulseira de aço|bracelete|aço inoxidável|aço|metal|steel/i.test(details);
  const isFabric = /tecido|nylon|canvas|nato/i.test(details);
  const isLeather = /couro|camurça|leather|suede/i.test(details);
  const dialColor = /verde|green/i.test(details) ? "#65734e"
    : /azul|blue/i.test(details) ? "#344c70"
      : /roxo|purple/i.test(details) ? "#65516d"
        : /creme|cream|bege|champagne/i.test(details) ? "#d4c8a9"
          : /branco|white|prata|silver/i.test(details) ? "#b5b5aa"
            : /cinza|gray|grey/i.test(details) ? "#77786f" : "#343831";
  const strapColor = isMetal ? "#aeb0a7"
    : isFabric ? "#596044"
      : isLeather ? "#55483b"
        : /dourad[oa]|gold/i.test(details) ? "#9b8052" : "#383b37";
  const isChronograph = /cron[oô]grafo|cron[oô]metro|chronograph/i.test(details);
  const bezelColor = /vermelho|red/i.test(details) ? "#8f4640"
    : /azul|blue/i.test(details) ? "#334b70" : "#343831";

  const strap = isMetal
    ? '<path d="M207 0h86l16 105H191zM191 255h118l-16 105h-86z" fill="url(#' + strapGradient + ')"/><path d="M207 14h86m-91 18h96m-100 18h104m-108 18h112m-108 202h104m-100 18h96m-91 18h86m-81 18h76" stroke="#e4e2d9" stroke-opacity=".62" stroke-width="3"/><path d="M214 0v104m72-104v104m-88 151v105m104-105v105" stroke="#55574e" stroke-opacity=".28" stroke-width="2"/>'
    : '<path d="M207 0h86l16 105H191zM191 255h118l-16 105h-86z" fill="url(#' + strapGradient + ')"/>' +
      (isFabric
        ? '<path d="M218 8v88m18-91v94m18-94v94m18-94v94m18-91v88m-98 163v88m18-88v94m18-94v94m18-94v94m18-94v88" stroke="#e3dfce" stroke-opacity=".23" stroke-width="3"/>'
        : isLeather
          ? '<path d="M217 18h66m-69 17h72m-75 17h78m-81 17h84m-80 214h76m-73 17h70m-67 17h64" stroke="#d3c8b7" stroke-opacity=".22" stroke-width="2"/>'
          : '<path d="M218 23h64m-67 22h70m-73 22h76m-73 207h70m-67 22h64m-61 22h58" stroke="#dedbcc" stroke-opacity=".22" stroke-width="3"/>');

  if (isDigital) {
    return '<svg viewBox="0 0 500 360" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' + strapGradient + '" x2="1"><stop stop-color="#252824"/><stop offset=".5" stop-color="' + strapColor + '"/><stop offset="1" stop-color="#252824"/></linearGradient><linearGradient id="' + caseGradient + '" x2="1"><stop stop-color="#77796d"/><stop offset=".5" stop-color="#d0cdbf"/><stop offset="1" stop-color="#686a60"/></linearGradient></defs>' +
      strap +
      '<rect x="144" y="94" width="212" height="172" rx="39" fill="url(#' + caseGradient + ')" stroke="#55574e" stroke-width="8"/>' +
      '<rect x="169" y="115" width="162" height="130" rx="23" fill="#242a27" stroke="#e0ddce" stroke-width="5"/>' +
      '<text x="250" y="145" text-anchor="middle" fill="#d9e3ca" font-family="monospace" font-size="11" letter-spacing="3">10:08</text>' +
      '<text x="250" y="194" text-anchor="middle" fill="#d9e3ca" font-family="monospace" font-size="40" letter-spacing="2">10:08</text>' +
      '<path d="M188 215h18m88 0h18" stroke="#aab49b" stroke-width="3"/><circle cx="250" cy="228" r="3" fill="#c6ceb8"/></svg>';
  }

  const caseShape = isOctagonal
    ? '<path d="M207 89 224 80h52l17 9 23 23v136l-23 23-17 9h-52l-17-9-23-23V112z" fill="url(#' + caseGradient + ')" stroke="#55574e" stroke-width="6"/>'
    : isSquare
      ? '<rect x="161" y="89" width="178" height="182" rx="27" fill="url(#' + caseGradient + ')" stroke="#55574e" stroke-width="6"/>'
      : '<circle cx="250" cy="180" r="91" fill="url(#' + caseGradient + ')" stroke="#55574e" stroke-width="' + (isDiver ? "10" : "5") + '"/>';
  const dialShape = isSquare
    ? '<rect x="179" y="108" width="142" height="144" rx="17"'
    : '<circle cx="250" cy="180" r="73"';
  const markerColor = /branco|white|prata|silver|creme|cream/i.test(details) ? "#55574e" : "#e6e1d2";
  const markers = isDigital
    ? ""
    : '<g stroke="' + markerColor + '" stroke-width="3" stroke-linecap="round">' +
      '<path d="M250 118v9m0 106v9m-62-62h9m106 0h9m-97-43 6 6m75 75 6 6m0-87-6 6m-75 75-6 6"/>' +
      (isChronograph
        ? '<circle cx="217" cy="180" r="17" fill="none" stroke-width="2"/><circle cx="283" cy="180" r="17" fill="none" stroke-width="2"/><circle cx="250" cy="213" r="17" fill="none" stroke-width="2"/>'
        : '<path d="M250 133v9m0 76v9m-44-47h9m76 0h9m-67-31 6 6m44 44 6 6m0-56-6 6m-44 44-6 6" stroke-width="2" opacity=".7"/>') +
      '</g>';
  const digitalWindow = isHybrid
    ? '<rect x="270" y="200" width="38" height="20" rx="3" fill="#222923" stroke="#cbc8bb" stroke-width="2"/><text x="289" y="214" text-anchor="middle" fill="#e1dfd3" font-family="monospace" font-size="8">10:08</text>'
    : "";
  const bezel = isDiver
    ? '<circle cx="250" cy="180" r="81" fill="none" stroke="' + bezelColor + '" stroke-width="8"/><path d="M250 100v12m56-3-7 11m36 43h-12m-5 67-11-7m-45 47v-12m-60 3 7-11m-36-43h12m5-67 11 7" stroke="#dedbcc" stroke-width="3"/>'
    : "";

  return '<svg viewBox="0 0 500 360" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="' + strapGradient + '" x2="1"><stop stop-color="#393b34"/><stop offset=".5" stop-color="' + strapColor + '"/><stop offset="1" stop-color="#393b34"/></linearGradient><linearGradient id="' + caseGradient + '" x2="1"><stop stop-color="#77796d"/><stop offset=".48" stop-color="#e2dfd2"/><stop offset="1" stop-color="#77796d"/></linearGradient><radialGradient id="' + dialGradient + '" cx=".35" cy=".25"><stop stop-color="' + dialColor + '"/><stop offset="1" stop-color="#20241f"/></radialGradient></defs>' +
    strap +
    caseShape +
    bezel +
    dialShape + ' fill="url(#' + dialGradient + ')" stroke="#d5d1c3" stroke-width="3"/>' +
    markers +
    digitalWindow +
    '<path d="M250 180 230 154M250 180l22-33" stroke="#e9e4d6" stroke-width="4" stroke-linecap="round"/><circle cx="250" cy="180" r="5" fill="#c1a56d"/>' +
    '<path d="M248 186 239 205" stroke="#c1a56d" stroke-width="2" stroke-linecap="round"/></svg>';
}

export function productImage(product, className = "") {
  return product.image_url
    ? '<img class="' + className + '" src="' + escapeHtml(product.image_url) + '" alt="' + escapeHtml(product.name) + '" loading="lazy" decoding="async">'
    : '<div class="watch-placeholder ' + className + '" role="img" aria-label="Ilustração de relógio: ' + escapeHtml(product.name) + '">' + watchIllustration(product, ++illustrationCount) + '</div>';
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
