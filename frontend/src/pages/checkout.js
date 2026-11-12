export async function openCheckout(ctx) {
  const {
    requireAuth,
    addressesApi,
    unwrap,
    createCheckoutDialog,
    esc,
    addressFieldsMarkup,
    cartDialog,
    notify,
    money,
  } = ctx;
  if (!requireAuth()) return;
  try {
    const addresses = unwrap(await addressesApi.listAddresses()) || [];
    const dialog = createCheckoutDialog();
    const content = dialog.querySelector("#checkoutContent");
    const cart = ctx.cart;
    const items = cart?.items || [];
    const shippingCents = items.length ? 2990 : 0;
    const shipping = shippingCents / 100;
    const estimatedTotal = money(
      (Math.round(Number(cart?.total || 0) * 100) + shippingCents) / 100,
    );
    const cartIssues = items.some(
      (item) => item.unavailable || item.exceeds_stock,
    );
    const savedAddressOptions = addresses
      .map((address, index) => {
        const location = [
          address.street + ", " + address.number,
          address.neighborhood,
          address.city + "/" + address.state,
          "CEP " + address.cep,
        ]
          .filter(Boolean)
          .map(esc)
          .join(" · ");
        return (
          '<option value="' +
          address.id +
          '"' +
          (index === 0 ? " selected" : "") +
          ">" +
          esc(address.recipient_name) +
          " — " +
          location +
          (index === 0 ? " (padrão)" : "") +
          "</option>"
        );
      })
      .join("");
    content.innerHTML =
      '<section class="panel checkout-summary"><h3>Resumo do pedido</h3>' +
      (items.length
        ? items
            .map((item) => {
              const product = item.product;
              const issue = item.unavailable
                ? "Produto indisponível."
                : item.exceeds_stock
                  ? "Quantidade acima do estoque disponível."
                  : "";
              return (
                '<div class="order-line"><div><strong>' +
                esc(product?.name || "Produto indisponível") +
                "</strong>" +
                "<span>" +
                item.quantity +
                " × " +
                money(product?.price) +
                "</span>" +
                (issue
                  ? '<small class="danger-text">' + issue + "</small>"
                  : "") +
                "</div><strong>" +
                money(item.subtotal) +
                "</strong></div>"
              );
            })
            .join("")
        : '<p class="muted">Seu carrinho está vazio.</p>') +
      '<div class="summary-line"><span>Subtotal</span><strong>' +
      money(cart?.total || 0) +
      "</strong></div>" +
      '<div class="summary-line"><span>Frete</span><strong>' +
      money(shipping) +
      "</strong></div>" +
      '<div class="summary-line grand-total"><span>Total estimado</span><strong>' +
      estimatedTotal +
      "</strong></div>" +
      '<p class="muted">A API recalcula e confirma o total ao criar o pedido.</p></section>' +
      (!items.length
        ? '<p class="danger-text">Adicione produtos ao carrinho antes de finalizar.</p>'
        : "") +
      (cartIssues
        ? '<p class="danger-text">Revise os itens indisponíveis ou acima do estoque no carrinho antes de finalizar.</p>'
        : "") +
      '<form id="checkoutForm" class="form-grid"><label class="wide">Endereço de entrega<select name="address_id" id="checkoutAddress">' +
      savedAddressOptions +
      '<option value=""' +
      (addresses.length ? "" : " selected") +
      ">Cadastrar novo endereço</option></select></label>" +
      '<div id="checkoutNewAddress" class="form-grid wide">' +
      addressFieldsMarkup() +
      '</div><button class="solid-btn wide" type="submit" ' +
      (!items.length || cartIssues ? "disabled" : "") +
      ">Criar pedido</button></form>";
    const addressFields = content.querySelector("#checkoutNewAddress");
    const syncAddressFields = () => {
      const selectedAddressId = content.querySelector("#checkoutAddress").value;
      const selectedAddress = addresses.find(
        (address) => String(address.id) === selectedAddressId,
      );
      addressFields.querySelectorAll("input").forEach((input) => {
        input.value = selectedAddress ? selectedAddress[input.name] || "" : "";
        input.disabled = Boolean(selectedAddress);
      });
    };
    content
      .querySelector("#checkoutAddress")
      .addEventListener("change", syncAddressFields);
    syncAddressFields();
    cartDialog.close();
    dialog.showModal();
  } catch (error) {
    notify(error.message, "error");
  }
}

export function createCheckoutDialog() {
  let dialog = document.getElementById("checkoutDialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "checkoutDialog";
    dialog.className = "modal";
    dialog.innerHTML =
      '<div class="modal-head"><h2>Finalizar pedido</h2><button class="icon-btn" data-close="checkoutDialog">×</button></div><div class="modal-body" id="checkoutContent"></div>';
    document.body.append(dialog);
  }
  return dialog;
}

export function addressFieldsMarkup() {
  return '<label>Destinatário<input name="recipient_name" required maxlength="100"></label><label>Rua<input name="street" required maxlength="150"></label><label>Número<input name="number" required maxlength="20"></label><label>Complemento<input name="complement" maxlength="100"></label><label>Bairro<input name="neighborhood" required maxlength="100"></label><label>Cidade<input name="city" required maxlength="100"></label><label>Estado (UF)<input name="state" required minlength="2" maxlength="2"></label><label>CEP<input name="cep" required placeholder="12345-678"></label>';
}
