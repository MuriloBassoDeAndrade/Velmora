import { api } from "./http.js";

export const listAdminOrders = (params = {}) => api("/api/admin/orders", { params });
export const updateOrderStatus = (id, status) => api("/api/admin/orders/" + id + "/status", { method: "PATCH", body: { status } });
export const updateProductStock = (id, stock) => api("/api/admin/products/" + id + "/stock", { method: "PATCH", body: { stock } });
export const getAdminProduct = (id) => api("/api/admin/products/" + id);
