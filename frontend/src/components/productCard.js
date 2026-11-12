import { money, escapeHtml } from "../utils/format.js";

let illustrationCount = 0;

const catalogImages = new Map([
  ["Casio Duro MDV-106-1A", "/images/relogio01.png"],
  ["Seiko 5 Sports SRPD55K1", "/images/relogio02.png"],
  ["Orient Bambino Version 4 FAC08003A0", "/images/relogio03.png"],
  [
    "Tissot PRX Powermatic 80 40 mm T137.407.11.041.00",
    "/images/relogio04.png",
  ],
  [
    "Tissot PRX Powermatic 80 35 mm T137.207.11.041.00",
    "/images/relogio05.png",
  ],
  ["Casio Vintage LA680WGA-1B", "/images/relogio06.png"],
  ["Casio LTP-V007D-7E", "/images/relogio07.png"],
  ["Casio LTP-1183A-7A", "/images/relogio08.png"],
  ["Casio LTP-V002D-7B", "/images/relogio09.png"],
  ["Casio MTP-V002D-7B", "/images/relogio10.png"],
  ["Casio MTP-V006L-7B", "/images/relogio11.png"],
  ["Tissot PRX T137.410.11.041.00", "/images/relogio12.png"],
  ["Orient Bambino RA-AC0M09E", "/images/relogio13.png"],
  ["Timex Weekender T2N651", "/images/relogio14.png"],
  ["Timex Expedition Scout T49961", "/images/relogio15.png"],
  ["Citizen Chandler BM8180-03E", "/images/relogio16.png"],
  ["Seiko 5 Sports SRPE53", "/images/relogio17.png"],
  ["Seiko 5 Sports SRPE55", "/images/relogio18.png"],
  ["Casio Edifice EFV-100D-1AV", "/images/relogio19.png"],
  ["Casio G-Shock GA-2100-1A", "/images/relogio20.png"],
  ["Casio G-Shock DW-5600UE-1", "/images/relogio21.png"],
  ["Casio G-Shock GA-100-1A1", "/images/relogio22.png"],
  ["Casio G-Shock DW-6900-1VH", "/images/relogio23.png"],
  ["Seiko 5 Sports SRPD53K1", "/images/relogio24.png"],
  ["Seiko Prospex SRPD29", "/images/relogio25.png"],
  ["Citizen Promaster BN0150-28E", "/images/relogio26.png"],
  ["Orient Diver RA-AA0004E", "/images/relogio27.png"],
  ["Casio Duro MDV-107-1A3", "/images/relogio28.png"],
  ["Seiko 5 Sports SRPE57", "/images/relogio29.png"],
  ["Tissot PRX T137.410.11.401.00", "/images/relogio30.png"],
]);

function watchIllustration(product, id) {
  const strapGradient = "watch-strap-" + id;
  const caseGradient = "watch-case-" + id;
  const dialGradient = "watch-dial-" + id;
  const shadowFilter = "watch-shadow-" + id;
  const screenGradient = "watch-screen-" + id;
  const details = [
    product.name,
    product.description,
    product.category?.name,
    ...Object.values(product.characteristics || {}),
  ]
    .join(" ")
    .toLocaleLowerCase("pt-BR");
  const isHybrid = /anal[oó]gico.digital|ga-100|ga-2100/i.test(details);
  const isDigital = /digital|la680|dw-5600|dw-6900/i.test(details) && !isHybrid;
  const isDiver = /mergulho|diver/i.test(details);
  const isOctagonal = /ga-2100|octagonal/i.test(details);
  const isSquare = /retangular|quadrad[oa]|rectangle|square|la680/i.test(
    details,
  );
  const isMetal =
    /pulseira de aço|bracelete|aço inoxidável|aço|metal|steel/i.test(details);
  const isFabric = /tecido|nylon|canvas|nato/i.test(details);
  const isLeather = /couro|camurça|leather|suede/i.test(details);
  const dialColor = /verde|green/i.test(details)
    ? "#65734e"
    : /azul|blue/i.test(details)
      ? "#344c70"
      : /roxo|purple/i.test(details)
        ? "#65516d"
        : /creme|cream|bege|champagne/i.test(details)
          ? "#d4c8a9"
          : /branco|white|prata|silver/i.test(details)
            ? "#b5b5aa"
            : /cinza|gray|grey/i.test(details)
              ? "#77786f"
              : "#343831";
  const strapColor = isMetal
    ? "#aeb0a7"
    : isFabric
      ? "#596044"
      : isLeather
        ? "#55483b"
        : /dourad[oa]|gold/i.test(details)
          ? "#9b8052"
          : "#383b37";
  const isChronograph = /cron[oô]grafo|cron[oô]metro|chronograph/i.test(
    details,
  );
  const bezelColor = /vermelho|red/i.test(details)
    ? "#8f4640"
    : /azul|blue/i.test(details)
      ? "#334b70"
      : "#343831";
  const minuteTrack = Array.from({ length: 60 }, (_, index) => {
    const length = index % 5 === 0 ? 8 : 4;
    return (
      '<line x1="250" y1="109" x2="250" y2="' +
      (109 + length) +
      '" transform="rotate(' +
      index * 6 +
      ' 250 180)"/>'
    );
  }).join("");
  const hasDate = /data|calend[aá]rio|date/i.test(details);
  const dateWindow = hasDate
    ? '<rect x="282" y="194" width="21" height="15" rx="2" fill="#e7e1d0" stroke="#a9a596" stroke-width="1"/><text x="292.5" y="205" text-anchor="middle" fill="#30332d" font-family="serif" font-size="9">18</text>'
    : "";
  const caseShadow =
    '<ellipse cx="250" cy="187" rx="102" ry="116" fill="#282b25" opacity=".18" filter="url(#' +
    shadowFilter +
    ')"/>';

  const strap = isMetal
    ? '<path d="M207 0h86l16 105H191zM191 255h118l-16 105h-86z" fill="url(#' +
      strapGradient +
      ')"/><path d="M207 14h86m-91 18h96m-100 18h104m-108 18h112m-108 202h104m-100 18h96m-91 18h86m-81 18h76" stroke="#e4e2d9" stroke-opacity=".62" stroke-width="3"/><path d="M214 0v104m72-104v104m-88 151v105m104-105v105" stroke="#55574e" stroke-opacity=".28" stroke-width="2"/>'
    : '<path d="M207 0h86l16 105H191zM191 255h118l-16 105h-86z" fill="url(#' +
      strapGradient +
      ')"/>' +
      (isFabric
        ? '<path d="M218 8v88m18-91v94m18-94v94m18-94v94m18-91v88m-98 163v88m18-88v94m18-94v94m18-94v94m18-94v88" stroke="#e3dfce" stroke-opacity=".23" stroke-width="3"/>'
        : isLeather
          ? '<path d="M217 18h66m-69 17h72m-75 17h78m-81 17h84m-80 214h76m-73 17h70m-67 17h64" stroke="#d3c8b7" stroke-opacity=".22" stroke-width="2"/>'
          : '<path d="M218 23h64m-67 22h70m-73 22h76m-73 207h70m-67 22h64m-61 22h58" stroke="#dedbcc" stroke-opacity=".22" stroke-width="3"/>');

  if (isDigital) {
    return (
      '<svg viewBox="0 0 500 360" aria-hidden="true" focusable="false">' +
      '<defs><linearGradient id="' +
      strapGradient +
      '" x2="1"><stop stop-color="#252824"/><stop offset=".5" stop-color="' +
      strapColor +
      '"/><stop offset="1" stop-color="#252824"/></linearGradient><linearGradient id="' +
      caseGradient +
      '" x2="1"><stop stop-color="#55584f"/><stop offset=".22" stop-color="#b6b5aa"/><stop offset=".5" stop-color="#e2dfd3"/><stop offset=".78" stop-color="#aaa99e"/><stop offset="1" stop-color="#55584f"/></linearGradient><linearGradient id="' +
      screenGradient +
      '" x2=".2" y2="1"><stop stop-color="#333b35"/><stop offset=".55" stop-color="#1b211e"/><stop offset="1" stop-color="#101512"/></linearGradient><filter id="' +
      shadowFilter +
      '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter></defs>' +
      caseShadow +
      strap +
      '<rect x="144" y="94" width="212" height="172" rx="39" fill="url(#' +
      caseGradient +
      ')" stroke="#55574e" stroke-width="8"/>' +
      '<rect x="156" y="105" width="188" height="150" rx="30" fill="none" stroke="#f1eee4" stroke-opacity=".62" stroke-width="2"/>' +
      '<rect x="169" y="115" width="162" height="130" rx="23" fill="url(#' +
      screenGradient +
      ')" stroke="#242924" stroke-width="4"/>' +
      '<path d="M180 124q47-16 132-3l-18 17q-52-7-104 12z" fill="#fff" opacity=".09"/>' +
      '<text x="250" y="145" text-anchor="middle" fill="#b9c9ae" font-family="monospace" font-size="11" letter-spacing="3">10:08</text>' +
      '<text x="250" y="194" text-anchor="middle" fill="#dce8cf" font-family="monospace" font-size="40" letter-spacing="2">10:08</text>' +
      '<path d="M188 215h18m88 0h18" stroke="#8c9c83" stroke-width="3"/><circle cx="250" cy="228" r="3" fill="#c6ceb8"/>' +
      '<rect x="132" y="144" width="12" height="27" rx="4" fill="url(#' +
      caseGradient +
      ')"/><rect x="356" y="144" width="12" height="27" rx="4" fill="url(#' +
      caseGradient +
      ')"/></svg>'
    );
  }

  const caseShape = isOctagonal
    ? '<path d="M207 89 224 80h52l17 9 23 23v136l-23 23-17 9h-52l-17-9-23-23V112z" fill="url(#' +
      caseGradient +
      ')" stroke="#55574e" stroke-width="6"/>'
    : isSquare
      ? '<rect x="161" y="89" width="178" height="182" rx="27" fill="url(#' +
        caseGradient +
        ')" stroke="#55574e" stroke-width="6"/>'
      : '<circle cx="250" cy="180" r="91" fill="url(#' +
        caseGradient +
        ')" stroke="#55574e" stroke-width="' +
        (isDiver ? "10" : "5") +
        '"/>';
  const dialShape = isSquare
    ? '<rect x="179" y="108" width="142" height="144" rx="17"'
    : '<circle cx="250" cy="180" r="73"';
  const markerColor = /branco|white|prata|silver|creme|cream/i.test(details)
    ? "#55574e"
    : "#e6e1d2";
  const markers =
    '<g stroke="' +
    markerColor +
    '" stroke-width="3" stroke-linecap="round">' +
    '<circle cx="250" cy="180" r="64" fill="none" stroke="' +
    markerColor +
    '" stroke-width=".8" opacity=".42"/>' +
    '<g stroke-width="1.5" opacity=".72">' +
    minuteTrack +
    "</g>" +
    '<path d="M250 118v9m0 106v9m-62-62h9m106 0h9m-97-43 6 6m75 75 6 6m0-87-6 6m-75 75-6 6"/>' +
    (isChronograph
      ? '<circle cx="217" cy="180" r="17" fill="none" stroke-width="2"/><circle cx="283" cy="180" r="17" fill="none" stroke-width="2"/><circle cx="250" cy="213" r="17" fill="none" stroke-width="2"/>'
      : '<path d="M250 133v9m0 76v9m-44-47h9m76 0h9m-67-31 6 6m44 44 6 6m0-56-6 6m-44 44-6 6" stroke-width="2" opacity=".7"/>') +
    "</g>";
  const digitalWindow = isHybrid
    ? '<rect x="270" y="200" width="38" height="20" rx="3" fill="#222923" stroke="#cbc8bb" stroke-width="2"/><text x="289" y="214" text-anchor="middle" fill="#e1dfd3" font-family="monospace" font-size="8">10:08</text>'
    : "";
  const bezel = isDiver
    ? '<circle cx="250" cy="180" r="81" fill="none" stroke="' +
      bezelColor +
      '" stroke-width="8"/><path d="M250 100v12m56-3-7 11m36 43h-12m-5 67-11-7m-45 47v-12m-60 3 7-11m-36-43h12m5-67 11 7" stroke="#dedbcc" stroke-width="3"/>'
    : "";

  return (
    '<svg viewBox="0 0 500 360" aria-hidden="true" focusable="false">' +
    '<defs><linearGradient id="' +
    strapGradient +
    '" x2="1"><stop stop-color="#393b34"/><stop offset=".18" stop-color="#62645b"/><stop offset=".48" stop-color="' +
    strapColor +
    '"/><stop offset=".82" stop-color="#62645b"/><stop offset="1" stop-color="#393b34"/></linearGradient><linearGradient id="' +
    caseGradient +
    '" x2="1"><stop stop-color="#55574e"/><stop offset=".16" stop-color="#b1b0a5"/><stop offset=".34" stop-color="#f0eee3"/><stop offset=".5" stop-color="#c1bfb3"/><stop offset=".72" stop-color="#e6e3d8"/><stop offset=".9" stop-color="#8f9086"/><stop offset="1" stop-color="#4f5149"/></linearGradient><radialGradient id="' +
    dialGradient +
    '" cx=".32" cy=".2"><stop stop-color="' +
    dialColor +
    '"/><stop offset=".54" stop-color="' +
    dialColor +
    '"/><stop offset="1" stop-color="#171b18"/></radialGradient><filter id="' +
    shadowFilter +
    '" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="9"/></filter></defs>' +
    caseShadow +
    strap +
    caseShape +
    '<circle cx="250" cy="180" r="' +
    (isDiver ? "85" : "83") +
    '" fill="none" stroke="#fff" stroke-opacity=".58" stroke-width="2"/>' +
    '<rect x="338" y="167" width="19" height="26" rx="5" fill="url(#' +
    caseGradient +
    ')" stroke="#55574e" stroke-width="2"/><path d="M343 171v18m5-18v18m5-18v18" stroke="#55574e" stroke-opacity=".55" stroke-width="1.2"/>' +
    bezel +
    dialShape +
    ' fill="url(#' +
    dialGradient +
    ')" stroke="#d5d1c3" stroke-width="3"/>' +
    markers +
    '<g fill="' +
    markerColor +
    '" font-family="serif" font-size="11" text-anchor="middle"><text x="250" y="137">12</text><text x="294" y="184">3</text><text x="250" y="235">6</text><text x="206" y="184">9</text></g>' +
    dateWindow +
    digitalWindow +
    '<path d="M250 180 230 154M250 180l22-33" stroke="#e9e4d6" stroke-width="4" stroke-linecap="round"/><circle cx="250" cy="180" r="5" fill="#c1a56d"/>' +
    '<path d="M248 186 239 205" stroke="#c1a56d" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M193 130q48-28 103-8l13 22q-44-13-93 15z" fill="#fff" opacity=".1"/><path d="M307 215q-24 31-53 34" fill="none" stroke="#fff" stroke-opacity=".12" stroke-width="3"/></svg>'
  );
}

export function productImage(product, className = "") {
  const imageUrl = product.image_url || catalogImages.get(product.name);
  return imageUrl
    ? '<img class="' +
        className +
        '" src="' +
        escapeHtml(imageUrl) +
        '" alt="' +
        escapeHtml(product.name) +
        '" loading="lazy" decoding="async">'
    : '<div class="watch-placeholder ' +
        className +
        '" role="img" aria-label="Ilustração de relógio: ' +
        escapeHtml(product.name) +
        '">' +
        watchIllustration(product, ++illustrationCount) +
        "</div>";
}

export function productCard(product) {
  const unavailable = Number(product.stock) < 1;
  return (
    '<article class="product-card">' +
    '<a class="product-visual" href="/produto/' +
    product.id +
    '" data-link>' +
    productImage(product) +
    (unavailable ? '<span class="stock-pill">Esgotado</span>' : "") +
    "</a>" +
    '<div class="product-info"><p class="eyebrow">' +
    escapeHtml(product.brand || product.category?.name || "Velmora") +
    "</p>" +
    '<h3><a href="/produto/' +
    product.id +
    '" data-link>' +
    escapeHtml(product.name) +
    "</a></h3>" +
    '<p class="product-category">' +
    escapeHtml(product.category?.name || "Relógio") +
    "</p>" +
    '<div class="product-buy"><strong>' +
    money(product.price) +
    '</strong><a class="text-link" href="/produto/' +
    product.id +
    '" data-link>Ver produto →</a></div></div></article>'
  );
}
