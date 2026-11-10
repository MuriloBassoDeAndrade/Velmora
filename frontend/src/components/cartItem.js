import { money, escapeHtml } from "../utils/format.js";
import { productImage } from "./productCard.js";

export function cartItem(item) {
  const product = item.product || {};
  return '<article class="cart-item">' + productImage(product, "cart-thumb") +
    '<div class="cart-item-main"><strong>' + escapeHtml(product.name || item.product_name || "Produto") + '</strong>' +
    '<span>' + money(item.unit_price ?? product.price) + '</span>' +
    '<div class="quantity-control"><button type="button" data-cart-change="minus" data-item="' + item.id + '" aria-label="Diminuir">−</button>' +
    '<span>' + Number(item.quantity || 0) + '</span><button type="button" data-cart-change="plus" data-item="' + item.id + '" aria-label="Aumentar">+</button>' +
    '<button type="button" class="text-link" data-cart-change="remove" data-item="' + item.id + '">Remover</button></div></div></article>';
}
