export function registerOrderEvents(ctx) {
  document.addEventListener("click", async (event) => {
    const pay = event.target.closest("[data-pay]");
    if (pay) {
      try {
        await ctx.ordersApi.payOrder(pay.dataset.pay);
        ctx.notify("Pagamento simulado registrado.");
        ctx.renderOrder(pay.dataset.pay);
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }

    const cancel = event.target.closest("[data-cancel-order]");
    if (cancel && confirm("Deseja cancelar este pedido? O estoque será devolvido.")) {
      try {
        await ctx.ordersApi.cancelOrder(cancel.dataset.cancelOrder);
        ctx.notify("Pedido cancelado.");
        ctx.renderOrder(cancel.dataset.cancelOrder);
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }
  });
}
