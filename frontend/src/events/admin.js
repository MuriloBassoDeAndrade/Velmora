import { formDataToObject } from "../utils/forms.js";

export function registerAdminEvents(ctx) {
  document.addEventListener("click", async (event) => {
    if (event.target.closest("[data-new-product]")) {
      document.getElementById("productEditor").innerHTML =
        ctx.productAdminForm();
    }

    const editProduct = event.target.closest("[data-edit-product]");
    if (editProduct) {
      try {
        const product = ctx.unwrap(
          await ctx.adminApi.getAdminProduct(editProduct.dataset.editProduct),
        );
        document.getElementById("productEditor").innerHTML =
          ctx.productAdminForm(product);
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }

    if (event.target.closest("[data-new-category]")) {
      document.getElementById("categoryEditor").innerHTML =
        ctx.categoryAdminForm();
    }

    const editCategory = event.target.closest("[data-edit-category]");
    if (editCategory) {
      const category = ctx.categories.find(
        (item) => item.id === Number(editCategory.dataset.editCategory),
      );
      if (category)
        document.getElementById("categoryEditor").innerHTML =
          ctx.categoryAdminForm(category);
    }

    const closeEditor = event.target.closest("[data-close-editor]");
    if (closeEditor)
      document.getElementById(closeEditor.dataset.closeEditor).innerHTML = "";

    const deleteProduct = event.target.closest("[data-delete-product]");
    if (
      deleteProduct &&
      confirm(
        "Excluir logicamente este produto? Pedidos antigos serão preservados.",
      )
    ) {
      try {
        await ctx.adminApi.deleteProduct(deleteProduct.dataset.deleteProduct);
        ctx.notify("Produto excluído.");
        ctx.renderAdmin();
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }

    const deleteCategory = event.target.closest("[data-delete-category]");
    if (deleteCategory && confirm("Excluir esta categoria?")) {
      try {
        await ctx.adminApi.deleteCategory(
          deleteCategory.dataset.deleteCategory,
        );
        ctx.notify("Categoria excluída.");
        ctx.renderAdmin();
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }

    const orderStatus = event.target.closest("[data-order-status]");
    if (orderStatus) {
      try {
        await ctx.adminApi.updateOrderStatus(
          orderStatus.dataset.orderStatus,
          orderStatus.dataset.nextStatus,
        );
        ctx.notify("Status do pedido atualizado.");
        ctx.renderAdmin();
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }
  });

  ctx.app.addEventListener("submit", async (event) => {
    const form = event.target;
    const formId = form.getAttribute("id");
    if (formId === "adminProductForm") {
      event.preventDefault();
      try {
        const formData = new FormData(form);
        const id = formData.get("id");
        formData.delete("id");
        if (id) formData.append("_method", "PUT");
        await (id
          ? ctx.adminApi.updateProduct(id, formData)
          : ctx.adminApi.createProduct(formData));
        ctx.notify("Produto salvo.");
        ctx.renderAdmin();
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    } else if (formId === "adminCategoryForm") {
      event.preventDefault();
      try {
        const data = formDataToObject(form);
        const id = data.id;
        delete data.id;
        await (id
          ? ctx.adminApi.updateCategory(id, data)
          : ctx.adminApi.createCategory(data));
        ctx.notify("Categoria salva.");
        ctx.renderAdmin();
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    } else if (form.matches("[data-stock-form]")) {
      event.preventDefault();
      try {
        const data = formDataToObject(form);
        await ctx.adminApi.updateProductStock(
          form.dataset.stockForm,
          Number(data.stock),
        );
        ctx.notify("Estoque atualizado.");
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    } else if (formId === "adminOrderFilter") {
      event.preventDefault();
      try {
        const status = new FormData(form).get("status");
        const params = new URLSearchParams(location.search);
        if (status) params.set("admin_order_status", status);
        else params.delete("admin_order_status");
        params.delete("admin_orders_page");
        const query = params.toString();
        history.pushState(
          {},
          "",
          location.pathname + (query ? "?" + query : "") + "#admin-orders",
        );
        await ctx.renderAdmin();
        document
          .getElementById("admin-orders")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch (error) {
        ctx.notify(error.message, "error");
      }
    }
  });

  ctx.app.addEventListener("change", (event) => {
    const input = event.target;
    if (!input.matches('#adminProductForm input[name="image"]')) return;

    const file = input.files?.[0];
    if (!file) return;

    const preview = document.querySelector("[data-product-image-preview]");
    if (!preview) return;

    const image = document.createElement("img");
    const objectUrl = URL.createObjectURL(file);
    image.className = "admin-product-preview-image";
    image.alt = "Prévia da imagem selecionada";
    image.dataset.previewUrl = objectUrl;
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      delete image.dataset.previewUrl;
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      delete image.dataset.previewUrl;
      ctx.notify(
        "Não foi possível carregar a prévia da imagem selecionada.",
        "error",
      );
    };
    image.src = objectUrl;
    preview.replaceChildren(image);
  });
}
