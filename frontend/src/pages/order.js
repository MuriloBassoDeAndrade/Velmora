export async function renderOrder(ctx, id) {
  const { requireAuth, loading, ordersApi, app, unwrap, esc, money, statusLabel, errorPage } = ctx;
  if (!requireAuth()) return;
  loading("Carregando pedido...");
  try {
    const order = unwrap(await ordersApi.getOrder(id));
    app.innerHTML = '<div class="breadcrumb"><a href="/pedidos" data-link>Meus pedidos</a><span>/</span><span>Pedido #' + order.id + '</span></div>' +
      '<section class="page-heading"><p class="eyebrow">DETALHES DA COMPRA</p><h1>Pedido #' + order.id + '</h1><p><span class="status-pill status-' + esc(order.status) + '">' + statusLabel(order.status) + '</span> · ' + new Date(order.created_at).toLocaleString("pt-BR") + '</p></section>' +
      '<div class="order-layout"><section class="panel"><h2>Itens do pedido</h2>' + (order.items || []).map((item) => '<div class="order-line"><div><strong>' + esc(item.product_name) + '</strong><span>' + item.quantity + ' × ' + money(item.unit_price) + '</span></div><strong>' + money(item.subtotal) + '</strong></div>').join("") +
      '<div class="summary-line"><span>Subtotal</span><strong>' + money(order.subtotal) + '</strong></div><div class="summary-line"><span>Frete</span><strong>' + money(order.shipping) + '</strong></div><div class="summary-line grand-total"><span>Total</span><strong>' + money(order.total) + '</strong></div>' +
      (order.status === "pending_payment" ? '<div class="action-row"><button class="solid-btn" data-pay="' + order.id + '">Confirmar pagamento simulado</button><button class="outline-btn danger" data-cancel-order="' + order.id + '">Cancelar pedido</button></div><p class="muted">Pagamento acadêmico simulado. Nenhum dado de cartão é utilizado.</p>' : '') +
      (order.payment ? '<p class="success-note">Pagamento registrado em ' + new Date(order.payment.paid_at).toLocaleString("pt-BR") + '.</p>' : '') + '</section>' +
      '<aside class="panel"><h2>Endereço de entrega</h2>' + (order.address ? '<strong>' + esc(order.address.recipient_name) + '</strong><p>' + esc(order.address.street) + ', ' + esc(order.address.number) + (order.address.complement ? ' · ' + esc(order.address.complement) : '') + '</p><p>' + esc(order.address.neighborhood) + ' — ' + esc(order.address.city) + '/' + esc(order.address.state) + '</p><p>CEP ' + esc(order.address.cep) + '</p>' : '<p>Endereço não disponível.</p>') + '</aside></div>';
  } catch (error) { errorPage(error); }
}
