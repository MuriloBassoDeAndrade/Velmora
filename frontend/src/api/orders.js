import { api } from "./http.js";

export const listOrders = (params = {}) => api("/api/orders", { params });
export const getOrder = (id) => api("/api/orders/" + id);
export const createOrder = (data) =>
  api("/api/orders", { method: "POST", body: data });
export const payOrder = (id) =>
  api("/api/orders/" + id + "/pay", { method: "POST" });
export const cancelOrder = (id) =>
  api("/api/orders/" + id + "/cancel", { method: "POST" });
