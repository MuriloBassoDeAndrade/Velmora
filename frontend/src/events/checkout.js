import { formDataToObject } from "../utils/forms.js";

export function registerCheckoutEvents(ctx) {
  document.addEventListener("submit", async (event) => {
    const form = event.target;
    if (form.getAttribute("id") !== "checkoutForm") return;
    event.preventDefault();
    try {
      const data = formDataToObject(form);
      let addressId = data.address_id;
      if (!addressId) {
        const addressData = { ...data };
        delete addressData.address_id;
        const address = ctx.unwrap(
          await ctx.addressesApi.createAddress(addressData),
        );
        addressId = address.id;
      }
      const order = ctx.unwrap(
        await ctx.ordersApi.createOrder({ address_id: Number(addressId) }),
      );
      document.getElementById("checkoutDialog").close();
      await ctx.loadCart();
      ctx.notify("Pedido criado. Confirme o pagamento simulado.");
      ctx.navigate("/pedido/" + order.id);
    } catch (error) {
      ctx.notify(error.message, "error");
    }
  });
}
