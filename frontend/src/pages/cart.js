export async function openCart() { {
  const { loadCart, cart, cartContent, cartItem, money, cartDialog, updateCartCount } = ctx;
  await loadCart();
  const items = cart?.items || [];
  cartContent.innerHTML = items.length
    ? items.map(cartItem).join("")
    : '<div class="empty-state"><h3>Seu carrinho está vazio</h3><p>Adicione um relógio para começar.</p></div>';
  document.getElementById("cartTotal").textContent = money(cart?.total || 0);
  document.getElementById("checkoutButton").disabled = !items.length;
  cartDialog.showModal();
}
document.addEventListener("click", async (event) => {
  const link = event.target.closest("a[data-link]");
  if (link && link.origin === location.origin) {
    event.preventDefault();
    if (link.closest("#accountDialog")) accountDialog.close();
    if (link.closest("#cartDialog")) cartDialog.close();
    navigate(link.pathname + link.search + link.hash);
    return;
  }
  const close = event.target.closest("[data-close]");
  if (close) document.getElementById(close.dataset.close)?.close();
  const authMode = event.target.closest("[data-auth-mode]");
  if (authMode) renderAuthForm(authMode.dataset.authMode);
  if (event.target.closest("[data-clear-filters]")) navigate("/");
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    const params = new URLSearchParams(location.search);
    params.set("page", pageButton.dataset.page);
    navigate("/?" + params.toString());
  }
  const addButton = event.target.closest("[data-add-product]");
  if (addButton) {
    try {
      const form = document.getElementById("addProductForm");
      const data = Object.fromEntries(new FormData(form).entries());
      cart = unwrap(await cartApi.addCartItem({ product_id: Number(data.product_id), quantity: Number(data.quantity) }));
      updateCartCount(); notify("Produto adicionado ao carrinho.");
    } catch (error) { notify(error.message, "error"); }
  }
  const cartAction = event.target.closest("[data-cart-change]");
  if (cartAction) {
    const id = cartAction.dataset.item;
    const item = cart?.items?.find((row) => String(row.id) === id);
    if (!item) return;
    const action = cartAction.dataset.cartChange;
    const quantity = action === "plus" ? item.quantity + 1 : action === "minus" ? item.quantity - 1 : 0;
    try {
      const result = action === "remove" || quantity < 1
        ? await cartApi.removeCartItem(id)
        : await cartApi.updateCartItem(id, { quantity });
      cart = unwrap(result); await openCart(); updateCartCount();
    } catch (error) { notify(error.message, "error"); }
  }
  const pay = event.target.closest("[data-pay]");
  if (pay) {
    try { await ordersApi.payOrder(pay.dataset.pay); notify("Pagamento simulado registrado."); renderOrder(pay.dataset.pay); }
    catch (error) { notify(error.message, "error"); }
  }
  const cancel = event.target.closest("[data-cancel-order]");
  if (cancel && confirm("Deseja cancelar este pedido? O estoque será devolvido.")) {
    try { await ordersApi.cancelOrder(cancel.dataset.cancelOrder); notify("Pedido cancelado."); renderOrder(cancel.dataset.cancelOrder); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-new-address]")) document.getElementById("addressEditor").innerHTML = addressForm();
  const editAddress = event.target.closest("[data-edit-address]");
  if (editAddress) {
    try { const list = unwrap(await addressesApi.listAddresses()); const address = list.find((a) => a.id === Number(editAddress.dataset.editAddress)); document.getElementById("addressEditor").innerHTML = addressForm(address); }
    catch (error) { notify(error.message, "error"); }
  }
  const deleteAddress = event.target.closest("[data-delete-address]");
  if (deleteAddress && confirm("Excluir este endereço?")) {
    try { await addressesApi.deleteAddress(deleteAddress.dataset.deleteAddress); notify("Endereço excluído."); renderProfile(); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-cancel-address]")) document.getElementById("addressEditor").innerHTML = "";
  if (event.target.closest("[data-new-product]")) document.getElementById("productEditor").innerHTML = productAdminForm();
  const editProduct = event.target.closest("[data-edit-product]");
  if (editProduct) {
    try { const product = unwrap(await adminApi.getAdminProduct(editProduct.dataset.editProduct)); document.getElementById("productEditor").innerHTML = productAdminForm(product); }
    catch (error) { notify(error.message, "error"); }
  }
  if (event.target.closest("[data-new-category]")) document.getElementById("categoryEditor").innerHTML = categoryAdminForm();
  const editCategory = event.target.closest("[data-edit-category]");
  if (editCategory) {
    const category = categories.find((c) => c.id === Number(editCategory.dataset.editCategory));
    if (category) document.getElementById("categoryEditor").innerHTML = categoryAdminForm(category);
  }
  const closeEditor = event.target.closest("[data-close-editor]");
  if (closeEditor) document.getElementById(closeEditor.dataset.closeEditor).innerHTML = "";
  const deleteProduct = event.target.closest("[data-delete-product]");
  if (deleteProduct && confirm("Excluir logicamente este produto? Pedidos antigos serão preservados.")) {
    try { await adminApi.deleteProduct(deleteProduct.dataset.deleteProduct); notify("Produto excluído."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
  const deleteCategory = event.target.closest("[data-delete-category]");
  if (deleteCategory && confirm("Excluir esta categoria?")) {
    try { await adminApi.deleteCategory(deleteCategory.dataset.deleteCategory); notify("Categoria excluída."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
  const orderStatus = event.target.closest("[data-order-status]");
  if (orderStatus) {
    try { await adminApi.updateOrderStatus(orderStatus.dataset.orderStatus, orderStatus.dataset.nextStatus); notify("Status do pedido atualizado."); renderAdmin(); }
    catch (error) { notify(error.message, "error"); }
  }
});
document.getElementById("accountContent").addEventListener("click", async (event) => {
  if (event.target.closest("#logoutButton")) {
    try { await authApi.logout(); currentUser = null; clearGuestToken(); setSessionUI(); accountDialog.close(); await loadCart(); notify("Sessão encerrada."); if (currentPath() !== "/") navigate("/"); }
    catch (error) { notify(error.message, "error"); }
  }
});
document.getElementById("accountContent").addEventListener("submit", async (event) => {
  if (event.target.id !== "authForm") return;
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.target).entries());
  try {
    const isRegister = Boolean(data.name);
    const payload = await (isRegister ? authApi.register(data) : authApi.login(data));
    await finishLogin(payload);
  } catch (error) { notify(error.message, "error"); }
});
app.addEventListener("submit", async (event) => {
  const form = event.target;
  event.preventDefault();
  try {
    if (form.id === "catalogFilters") {
      const data = Object.fromEntries(new FormData(form).entries());
      const params = new URLSearchParams();
      Object.entries(data).forEach(([key, value]) => { if (value) params.set(key, value); });
      navigate("/" + (params.toString() ? "?" + params.toString() : ""));
    } else if (form.id === "addProductForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      cart = unwrap(await cartApi.addCartItem({ product_id: Number(data.product_id), quantity: Number(data.quantity) }));
      updateCartCount(); notify("Produto adicionado ao carrinho.");
    } else if (form.id === "checkoutForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      let addressId = data.address_id;
      if (!addressId) {
        const addressData = Object.fromEntries(new FormData(form).entries());
        delete addressData.address_id;
        const address = unwrap(await addressesApi.createAddress(addressData));
        addressId = address.id;
      }
      const order = unwrap(await ordersApi.createOrder({ address_id: Number(addressId) }));
      document.getElementById("checkoutDialog").close();
      await loadCart(); notify("Pedido criado. Confirme o pagamento simulado.");
      navigate("/pedido/" + order.id);
    } else if (form.id === "profileForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      Object.keys(data).forEach((key) => { if (!data[key]) delete data[key]; });
      currentUser = await authApi.updateProfile(data);
      setSessionUI(); notify("Perfil atualizado."); renderProfile();
    } else if (form.id === "addressForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      const id = data.id; delete data.id;
      await (id ? addressesApi.updateAddress(id, data) : addressesApi.createAddress(data));
      notify("Endereço salvo."); renderProfile();
    } else if (form.id === "adminProductForm") {
      const formData = new FormData(form);
      const id = formData.get("id");
      formData.delete("id");
      if (id) formData.append("_method", "PUT");
      await (id ? adminApi.updateProduct(id, formData) : adminApi.createProduct(formData));
      notify("Produto salvo."); renderAdmin();
    } else if (form.id === "adminCategoryForm") {
      const data = Object.fromEntries(new FormData(form).entries());
      const id = data.id; delete data.id;
      await (id ? adminApi.updateCategory(id, data) : adminApi.createCategory(data));
      notify("Categoria salva."); renderAdmin();
    } else if (form.matches("[data-stock-form]")) {
      const data = Object.fromEntries(new FormData(form).entries());
      await adminApi.updateProductStock(form.dataset.stockForm, Number(data.stock));
      notify("Estoque atualizado.");
    } else if (form.id === "adminOrderFilter") {
      const status = new FormData(form).get("status");
      const payload = await adminApi.listAdminOrders(status ? { status } : {});
      const rows = payload.data || [];
      const tbody = document.querySelector("#admin-orders tbody");
      if (tbody) tbody.innerHTML = rows.map((o) => '<tr><td>#' + o.id + '</td><td>' + esc(o.user?.name || o.user?.email || "Cliente") + '</td><td>' + new Date(o.created_at).toLocaleDateString("pt-BR") + '</td><td>' + money(o.total) + '</td><td>' + statusLabel(o.status) + '</td><td>' + (o.status === "paid" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="shipped">Marcar enviado</button>' : o.status === "shipped" ? '<button class="text-link" data-order-status="' + o.id + '" data-next-status="delivered">Marcar entregue</button>' : "—") + '</td></tr>').join("");
    }
  } catch (error) { notify(error.message, "error"); }
}
