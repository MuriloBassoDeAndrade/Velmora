import { statusPill } from "../components/statusPill.js";
import { date } from "../utils/format.js";

export async function renderOrders(ctx) {
  const {
    requireAuth,
    loading,
    ordersApi,
    app,
    money,
    statusLabel,
    errorPage,
  } = ctx;
  if (!requireAuth()) return;
  const requestedPage = Number(
    new URLSearchParams(location.search).get("page"),
  );
  const page =
    Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  loading("Buscando seus pedidos...");
  try {
    const payload = await ordersApi.listOrders({ page });
    const orders = payload.data || [];
    const meta = payload.meta || {
      current_page: page,
      last_page: 1,
      total: orders.length,
      from: 0,
      to: orders.length,
    };
    if (page > Number(meta.last_page) && Number(meta.last_page) > 0) {
      const params = new URLSearchParams(location.search);
      params.set("page", String(meta.last_page));
      history.replaceState({}, "", location.pathname + "?" + params.toString());
      return renderOrders(ctx);
    }
    app.innerHTML =
      '<section class="page-heading"><p class="eyebrow">SUA CONTA</p><h1>Meus pedidos</h1><p>Acompanhe suas compras e consulte os detalhes de cada pedido.</p></section>' +
      (orders.length
        ? '<div class="table-wrap"><table><thead><tr><th>Pedido</th><th>Data</th><th>Total</th><th>Status</th><th></th></tr></thead><tbody>' +
          orders
            .map(
              (order) =>
                "<tr><td>#" +
                order.id +
                "</td><td>" +
                date(order.created_at) +
                "</td><td>" +
                money(order.total) +
                "</td><td>" +
                statusPill(order.status, statusLabel(order.status)) +
                '</td><td><a class="text-link" href="/pedido/' +
                order.id +
                '" data-link>Ver pedido →</a></td></tr>',
            )
            .join("") +
          "</tbody></table></div>" +
          ordersPagination(meta)
        : '<div class="empty-state"><h3>Você ainda não fez pedidos</h3><p>Quando finalizar uma compra, ela aparecerá aqui.</p><a href="/" data-link class="solid-btn">Explorar relógios</a></div>');
  } catch (error) {
    errorPage(error);
  }
}

function ordersPagination(meta) {
  const currentPage = Number(meta.current_page) || 1;
  const lastPage = Number(meta.last_page) || 1;
  const total = Number(meta.total) || 0;
  const from = Number(meta.from) || 0;
  const to = Number(meta.to) || 0;
  if (lastPage <= 1) return "";

  const pages = new Set([1, lastPage]);
  for (
    let page = Math.max(1, currentPage - 1);
    page <= Math.min(lastPage, currentPage + 1);
    page++
  ) {
    pages.add(page);
  }
  let previousPage = 0;
  const pageButtons = [...pages]
    .sort((a, b) => a - b)
    .map((page) => {
      const gap =
        page - previousPage > 1
          ? '<span class="pagination-ellipsis" aria-hidden="true">…</span>'
          : "";
      previousPage = page;
      return (
        gap +
        '<button type="button" class="' +
        (page === currentPage ? "is-current" : "") +
        '" data-orders-page="' +
        page +
        '"' +
        (page === currentPage ? ' aria-current="page" disabled' : "") +
        ">" +
        page +
        "</button>"
      );
    })
    .join("");

  return (
    '<div class="admin-pagination-row"><p class="admin-pagination-summary">Exibindo ' +
    from +
    "–" +
    to +
    " de " +
    total +
    " pedidos</p>" +
    '<nav class="pagination admin-pagination" aria-label="Paginação de pedidos">' +
    '<button type="button" data-orders-page="' +
    (currentPage - 1) +
    '" aria-label="Página anterior"' +
    (currentPage <= 1 ? " disabled" : "") +
    ">Anterior</button>" +
    pageButtons +
    '<button type="button" data-orders-page="' +
    (currentPage + 1) +
    '" aria-label="Próxima página"' +
    (currentPage >= lastPage ? " disabled" : "") +
    ">Próxima</button>" +
    "</nav></div>"
  );
}
