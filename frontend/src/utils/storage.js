const GUEST_TOKEN_KEY = "velmora_guest_token";

export const getCartToken = () => localStorage.getItem(GUEST_TOKEN_KEY);
export const setCartToken = (token) => token && localStorage.setItem(GUEST_TOKEN_KEY, token);
export const removeCartToken = () => localStorage.removeItem(GUEST_TOKEN_KEY);
