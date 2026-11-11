export async function openCart(ctx) {
  const { loadCart, cartContent, cartItem, money, cartDialog, updateCartCount } = ctx;
  await loadCart();
  const cart = ctx.cart;
  const items = cart?.items || [];
  cartContent.innerHTML = items.length
    ? items.map(cartItem).join("")
    : '<div class="empty-state"><h3>Seu carrinho está vazio</h3><p>Adicione um relógio para começar.</p></div>';
  document.getElementById("cartTotal").textContent = money(cart?.total || 0);
  document.getElementById("checkoutButton").disabled = !items.length;
  cartDialog.showModal();
}
