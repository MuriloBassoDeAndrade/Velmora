import axios from "axios";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");
const GUEST_TOKEN_KEY = "velmora_guest_token";

export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  withXSRFToken: true,
  headers: { Accept: "application/json" },
});

export function guestToken() {
  return localStorage.getItem(GUEST_TOKEN_KEY);
}

export function saveGuestToken(token) {
  if (token) localStorage.setItem(GUEST_TOKEN_KEY, token);
}

export function clearGuestToken() {
  localStorage.removeItem(GUEST_TOKEN_KEY);
}

export function readCookie(name) {
  const prefix = name + "=";
  const item = document.cookie
    .split("; ")
    .find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : null;
}

export async function csrf() {
  await http.get("/sanctum/csrf-cookie");
}

http.interceptors.request.use(async (config) => {
  const method = (config.method || "get").toUpperCase();
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    if (!readCookie("XSRF-TOKEN")) await csrf();
    const token = readCookie("XSRF-TOKEN");
    if (token) config.headers.set("X-XSRF-TOKEN", token);
  }
  const token = guestToken();
  if (token) config.headers.set("X-Guest-Token", token);
  return config;
});

http.interceptors.response.use(
  (response) => {
    saveGuestToken(response.headers["x-guest-token"]);
    return response;
  },
  (error) => {
    const payload = error.response?.data;
    const details = payload?.errors
      ? Object.values(payload.errors).flat().join(" ")
      : "";
    error.message =
      details || payload?.message || error.message || "A solicitação falhou.";
    return Promise.reject(error);
  },
);

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  const response = await http.request({
    url: path,
    method: options.method || "GET",
    data: options.body,
    params: options.params,
    headers,
  });
  return response.data;
}

export default api;
