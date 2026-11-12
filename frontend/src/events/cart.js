import { formDataToObject } from "../utils/forms.js";

async function addProductToCart(form, button, ctx) {
  button.disabled = true;
  try {
    const data = formDataToObject(form);
    ctx.cart = ctx.unwrap(
      await ctx.cartApi.addCartItem({
        product_id: Number(data.product_id),
        quantity: Number(data.quantity),
      }),
    );
    ctx.updateCartCount();
    await ctx.openCart();
    ctx.notify("Produto adicionado ao carrinho.");
  } catch (error) {
    ctx.notify(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

export function registerCartEvents(ctx) {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("#cartButton")) {
      await ctx.openCart();
      return;
    }

    if (event.target.closest("#checkoutButton")) {
      if (ctx.currentUser) {
        await ctx.openCheckout();
      } else {
        sessionStorage.setItem("velmora_continue_to_checkout", "1");
        ctx.requireAuth();
      }
      return;
    }

    const addButton = event.target.closest("[data-add-product]");
    if (addButton) {
      event.preventDefault();
      await addProductToCart(addButton.form, addButton, ctx);
      return;
    }

    const cartAction = event.target.closest("[data-cart-change]");
    if (!cartAction) return;

    const id = cartAction.dataset.item;
    const item = ctx.cart?.items?.find((row) => String(row.id) === id);
    if (!item) return;
    const action = cartAction.dataset.cartChange;
    const quantity =
      action === "plus"
        ? item.quantity + 1
        : action === "minus"
          ? item.quantity - 1
          : 0;
    try {
      const result =
        action === "remove" || quantity < 1
          ? await ctx.cartApi.removeCartItem(id)
          : await ctx.cartApi.updateCartItem(id, { quantity });
      ctx.cart = ctx.unwrap(result);
      await ctx.openCart();
      ctx.updateCartCount();
    } catch (error) {
      ctx.notify(error.message, "error");
    }
  });

  ctx.app.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.getAttribute("id") !== "addProductForm") return;
    event.preventDefault();
    await addProductToCart(form, form.querySelector("[data-add-product]"), ctx);
  });
}
