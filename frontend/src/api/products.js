import { api } from "./http.js";

export const listProducts = (params = {}) => api("/api/products", { params });
export const getProduct = (id) => api("/api/products/" + id);
export const listCategories = () => api("/api/categories");
