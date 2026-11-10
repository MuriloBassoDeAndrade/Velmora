import { api } from "./http.js";

export const listAdminOrders = (params = {}) => api("/api/admin/orders", { params });
export const updateOrderStatus = (id, status) => api("/api/admin/orders/" + id + "/status", { method: "PATCH", body: { status } });
export const updateProductStock = (id, stock) => api("/api/admin/products/" + id + "/stock", { method: "PATCH", body: { stock } });
export const getAdminProduct = (id) => api("/api/admin/products/" + id);

export const listAdminProducts = () => api("/api/admin/products");
export const listCharacteristics = () => api("/api/characteristics");
export const createProduct = (data) => api("/api/products", { method: "POST", body: data });
export const updateProduct = (id, data) => api("/api/products/" + id, { method: "POST", body: data });
export const deleteProduct = (id) => api("/api/products/" + id, { method: "DELETE" });
export const createCategory = (data) => api("/api/categories", { method: "POST", body: data });
export const updateCategory = (id, data) => api("/api/categories/" + id, { method: "PUT", body: data });
export const deleteCategory = (id) => api("/api/categories/" + id, { method: "DELETE" });
