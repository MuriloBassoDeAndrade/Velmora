export async function renderProfile(ctx) {
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

export function addressCard(ctx, address) {
  const { esc } = ctx;
  return '<article class="address-card"><div><strong>' + esc(address.recipient_name) + '</strong><p>' + esc(address.street) + ', ' + esc(address.number) + ' — ' + esc(address.city) + '/' + esc(address.state) + '</p><small>CEP ' + esc(address.cep) + '</small></div><div class="inline-actions"><button class="text-link" data-edit-address="' + address.id + '">Editar</button><button class="text-link danger-text" data-delete-address="' + address.id + '">Excluir</button></div></article>';
}

export function addressForm(ctx, address = {}) {
  const { esc } = ctx;
  return '<form id="addressForm" class="form-grid compact-form"><input type="hidden" name="id" value="' + (address.id || "") + '">' +
    '<label>Destinatário<input name="recipient_name" required maxlength="100" value="' + esc(address.recipient_name) + '"></label>' +
    '<label>Rua<input name="street" required maxlength="150" value="' + esc(address.street) + '"></label>' +
    '<label>Número<input name="number" required maxlength="20" value="' + esc(address.number) + '"></label>' +
    '<label>Complemento<input name="complement" maxlength="100" value="' + esc(address.complement) + '"></label>' +
    '<label>Bairro<input name="neighborhood" required maxlength="100" value="' + esc(address.neighborhood) + '"></label>' +
    '<label>Cidade<input name="city" required maxlength="100" value="' + esc(address.city) + '"></label>' +
    '<label>Estado (UF)<input name="state" required minlength="2" maxlength="2" value="' + esc(address.state) + '"></label>' +
    '<label>CEP<input name="cep" required placeholder="12345-678" value="' + esc(address.cep) + '"></label>' +
    '<div class="form-actions"><button class="solid-btn" type="submit">Salvar endereço</button><button class="outline-btn" type="button" data-cancel-address>Cancelar</button></div></form>';
}
