export async function renderProfile(ctx, ) {
  const { requireAuth, loading, addressesApi, unwrap, app, esc, currentUser, addressCard, errorPage } = ctx;
  if (!requireAuth()) return;
  loading("Carregando seu perfil...");
  try {
    const addresses = unwrap(await addressesApi.listAddresses()) || [];
    app.innerHTML = '<section class="page-heading"><p class="eyebrow">SUA CONTA</p><h1>Perfil e endereços</h1><p>Atualize seus dados e mantenha seus endereços de entrega.</p></section>' +
      '<div class="profile-grid"><section class="panel"><h2>Dados pessoais</h2><form id="profileForm" class="form-grid"><label>Nome<input name="name" required maxlength="50" value="' + esc(currentUser.name) + '"></label><label>E-mail<input name="email" type="email" required value="' + esc(currentUser.email) + '"></label><label>Senha atual <small>(necessária para trocar a senha)</small><input name="current_password" type="password" autocomplete="current-password"></label><label>Nova senha<input name="password" type="password" minlength="8" autocomplete="new-password"></label><label>Confirmar nova senha<input name="password_confirmation" type="password" minlength="8" autocomplete="new-password"></label><button class="solid-btn" type="submit">Salvar alterações</button></form></section>' +
      '<section class="panel"><div class="panel-title-row"><h2>Endereços</h2><button class="outline-btn" data-new-address>Adicionar</button></div><div class="address-list">' +
      (addresses.length ? addresses.map(addressCard).join("") : '<p class="muted">Nenhum endereço cadastrado.</p>') + '</div><div id="addressEditor"></div></section></div>';
  } catch (error) { errorPage(error); }
}
