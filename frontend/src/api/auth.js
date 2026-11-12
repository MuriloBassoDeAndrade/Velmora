import { api } from "./http.js";

export const getCurrentUser = () => api("/api/user");
export const login = (credentials) =>
  api("/api/login", { method: "POST", body: credentials });
export const register = (data) =>
  api("/api/register", { method: "POST", body: data });
export const logout = () => api("/api/logout", { method: "POST" });
export const updateProfile = (data) =>
  api("/api/user", { method: "PUT", body: data });
