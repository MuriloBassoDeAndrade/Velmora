import { api } from "./http.js";

export const getCart = () => api("/api/cart");
export const addCartItem = (data) => api("/api/cart/items", { method: "POST", body: data });
export const updateCartItem = (id, data) => api("/api/cart/items/" + id, { method: "PUT", body: data });
export const removeCartItem = (id) => api("/api/cart/items/" + id, { method: "DELETE" });
