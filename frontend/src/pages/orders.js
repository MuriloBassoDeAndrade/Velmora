export async function renderOrders(ctx) {
  const { requireAuth, loading, ordersApi, app, money, esc, statusLabel, errorPage } = ctx;
  if (!requireAuth()) return;
  loading("Buscando seus pedidos...");
  try {
    const payload = await ordersApi.listOrders();
    const orders = payload.data || [];
    app.innerHTML = '<section class="page-heading"><p class="eyebrow">SUA CONTA</p><h1>Meus pedidos</h1><p>Acompanhe suas compras e consulte os detalhes de cada pedido.</p></section>' +
      (orders.length ? '<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Data</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
      orders.map((order) => '<tr><td>#' + order.id + '</td><td>' + new Date(order.created_at).toLocaleDateString("pt-BR") + '</td><td>' + money(order.total) + '</td><td><span class="status-pill status-' + esc(order.status) + '">' + statusLabel(order.status) + '</span></td><td><a class="text-link" href="/pedido/' + order.id + '" data-link>Ver pedido →</a></td></tr>').join("") +
      '</tbody></table></div>' : '<div class="empty-state"><h3>Você ainda não fez pedidos</h3><p>Quando finalizar uma compra, ela aparecerá aqui.</p><a href="/" data-link class="solid-btn">Explorar relógios</a></div>');
  } catch (error) { errorPage(error); }
}
