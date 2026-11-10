export function renderNotFound(ctx) {
  ctx.app.innerHTML = '<section class="empty-state"><p class="eyebrow">404</p><h1>Página não encontrada</h1><p>O endereço acessado não existe.</p><a class="solid-btn" href="/" data-link>Voltar à loja</a></section>';
}
