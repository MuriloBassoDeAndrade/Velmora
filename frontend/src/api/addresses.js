import { api } from "./http.js";

export const listAddresses = () => api("/api/addresses");
export const createAddress = (data) =>
  api("/api/addresses", { method: "POST", body: data });
export const updateAddress = (id, data) =>
  api("/api/addresses/" + id, { method: "PUT", body: data });
export const deleteAddress = (id) =>
  api("/api/addresses/" + id, { method: "DELETE" });
