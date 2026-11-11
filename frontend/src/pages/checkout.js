export async function openCheckout(ctx) {
  const { requireAuth, addressesApi, unwrap, createCheckoutDialog, esc, addressFieldsMarkup, cartDialog, notify } = ctx;
  if (!requireAuth()) return;
  try {
    const addresses = unwrap(await addressesApi.listAddresses()) || [];
    const dialog = createCheckoutDialog();
    const content = dialog.querySelector("#checkoutContent");
    const savedAddressOptions = addresses.map((address, index) => {
      const location = [
        address.street + ", " + address.number,
        address.neighborhood,
        address.city + "/" + address.state,
        "CEP " + address.cep,
      ].filter(Boolean).map(esc).join(" · ");
      return '<option value="' + address.id + '"' + (index === 0 ? " selected" : "") + '>' +
        esc(address.recipient_name) + " — " + location + (index === 0 ? " (padrão)" : "") + '</option>';
    }).join("");
    content.innerHTML = '<p class="muted">O frete fixo é de R$ 29,90. O total será calculado e confirmado pelo servidor.</p>' +
      '<form id="checkoutForm" class="form-grid"><label class="wide">Endereço de entrega<select name="address_id" id="checkoutAddress">' + savedAddressOptions + '<option value=""' + (addresses.length ? "" : " selected") + '>Cadastrar novo endereço</option></select></label>' +
      '<div id="checkoutNewAddress" class="form-grid wide">' + addressFieldsMarkup() + '</div><button class="solid-btn wide" type="submit">Criar pedido</button></form>';
    const addressFields = content.querySelector("#checkoutNewAddress");
    const syncAddressFields = () => {
      const selectedAddressId = content.querySelector("#checkoutAddress").value;
      const selectedAddress = addresses.find((address) => String(address.id) === selectedAddressId);
      addressFields.querySelectorAll("input").forEach((input) => {
        input.value = selectedAddress ? (selectedAddress[input.name] || "") : "";
        input.disabled = Boolean(selectedAddress);
      });
    };
    content.querySelector("#checkoutAddress").addEventListener("change", syncAddressFields);
    syncAddressFields();
    cartDialog.close();
    dialog.showModal();
  } catch (error) { notify(error.message, "error"); }
}

export function createCheckoutDialog() {
  let dialog = document.getElementById("checkoutDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "checkoutDialog";
    dialog.className = "modal";
    dialog.innerHTML = '<div class="modal-head"><h2>Finalizar pedido</h2><button class="icon-btn" data-close="checkoutDialog">×</button></div><div class="modal-body" id="checkoutContent"></div>';
    document.body.append(dialog);
  }
  return dialog;
}

export function addressFieldsMarkup() {
  return '<label>Destinatário<input name="recipient_name" required maxlength="100"></label><label>Rua<input name="street" required maxlength="150"></label><label>Número<input name="number" required maxlength="20"></label><label>Complemento<input name="complement" maxlength="100"></label><label>Bairro<input name="neighborhood" required maxlength="100"></label><label>Cidade<input name="city" required maxlength="100"></label><label>Estado (UF)<input name="state" required minlength="2" maxlength="2"></label><label>CEP<input name="cep" required placeholder="12345-678"></label>';
}
