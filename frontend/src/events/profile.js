import { formDataToObject } from "../utils/forms.js";

export function registerProfileEvents(ctx) {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-new-address]")) {
      document.getElementById("addressEditor").innerHTML = ctx.addressForm();
    }

    const editAddress = event.target.closest("[data-edit-address]");
    if (editAddress) {
      try {
        const list = ctx.unwrap(await ctx.addressesApi.listAddresses());
        const address = list.find(
          (item) => item.id === Number(editAddress.dataset.editAddress),
        );
        document.getElementById("addressEditor").innerHTML =
          ctx.addressForm(address);
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }

    const deleteAddress = event.target.closest("[data-delete-address]");
    if (deleteAddress && confirm("Excluir este endereço?")) {
      try {
        await ctx.addressesApi.deleteAddress(
          deleteAddress.dataset.deleteAddress,
        );
        ctx.notify("Endereço excluído.");
        ctx.renderProfile();
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }

    if (event.target.closest("[data-cancel-address]")) {
      document.getElementById("addressEditor").innerHTML = "";
    }
  });

  ctx.app.addEventListener("submit", async (event) => {
    const form = event.target;
    const formId = form.getAttribute("id");
    if (!["profileForm", "passwordForm", "addressForm"].includes(formId))
      return;
    event.preventDefault();
    try {
      if (formId === "profileForm") {
        const data = formDataToObject(form);
        Object.keys(data).forEach((key) => {
          if (!data[key]) delete data[key];
        });
        ctx.currentUser = await ctx.authApi.updateProfile(data);
        ctx.setSessionUI();
        ctx.notify("Perfil atualizado.");
        ctx.renderProfile();
      } else if (formId === "passwordForm") {
        const data = formDataToObject(form);
        await ctx.authApi.updateProfile(data);
        form.reset();
        ctx.notify("Senha atualizada com sucesso.");
      } else {
        const data = formDataToObject(form);
        const id = data.id;
        delete data.id;
        await (id
          ? ctx.addressesApi.updateAddress(id, data)
          : ctx.addressesApi.createAddress(data));
        ctx.notify("Endereço salvo.");
        ctx.renderProfile();
      }
    } catch (error) {
      ctx.notify(error.message, "error");
    }
  });
}
