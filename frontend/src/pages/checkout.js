export async function openCheckout(ctx, ) {
  const { requireAuth, addressesApi, unwrap, createCheckoutDialog, esc, addressFieldsMarkup, cartDialog, notify } = ctx;
  if (!requireAuth()) return;
  try {
    const addresses = unwrap(await addressesApi.listAddresses()) || [];
    const dialog = createCheckoutDialog();
    const content = dialog.querySelector("#checkoutContent");
    content.innerHTML = '<p class="muted">O frete fixo é de R$ 29,90. O total será calculado e confirmado pelo servidor.</p>' +
      '<form id="checkoutForm" class="form-grid"><label class="wide">Endereço de entrega<select name="address_id" id="checkoutAddress"><option value="">Cadastrar novo endereço</option>' + addresses.map((a) => '<option value="' + a.id + '">' + esc(a.recipient_name) + ' — ' + esc(a.street) + ', ' + esc(a.number) + ' · ' + esc(a.city) + '/' + esc(a.state) + '</option>').join("") + '</select></label>' +
      '<div id="checkoutNewAddress" class="form-grid wide" ' + (addresses.length ? "hidden" : "") + '>' + addressFieldsMarkup() + '</div><button class="solid-btn wide" type="submit">Criar pedido</button></form>';
    const addressFields = content.querySelector("#checkoutNewAddress");
    const syncAddressFields = () => {
      const useExisting = Boolean(content.querySelector("#checkoutAddress").value);
      addressFields.hidden = useExisting;
      addressFields.querySelectorAll("input").forEach((input) => input.disabled = useExisting);
    };
    content.querySelector("#checkoutAddress").addEventListener("change", syncAddressFields);
    syncAddressFields();
    cartDialog.close();
    dialog.showModal();
  } catch (error) { notify(error.message, "error"); }
}
