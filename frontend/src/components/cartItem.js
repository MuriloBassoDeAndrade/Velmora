import { money, escapeHtml } from "../utils/format.js";
import { productImage } from "./productCard.js";

export function cartItem(item) {
  const product = item.product;
  const unavailable = item.unavailable || !product;
  return '<article class="cart-item">' + productImage(product || {}, "cart-thumb") +
    '<div class="cart-item-main"><strong>' + escapeHtml(product?.name || "Produto indisponível") + '</strong>' +
    '<span>' + money(product?.price) + ' · Subtotal ' + money(item.subtotal) + '</span>' +
    (unavailable ? '<small class="danger-text">Produto indisponível.</small>' : item.exceeds_stock ? '<small class="danger-text">Quantidade acima do estoque.</small>' : '') +
    '<div class="quantity-control"><button type="button" data-cart-change="minus" data-item="' + item.id + '">−</button>' +
    '<span>' + item.quantity + '</span><button type="button" data-cart-change="plus" data-item="' + item.id + '" ' + (unavailable ? "disabled" : "") + '>+</button>' +
    '<button type="button" class="text-link danger-text" data-cart-change="remove" data-item="' + item.id + '">Remover</button></div></div></article>';
}
