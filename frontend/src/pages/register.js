import { renderAuthForm } from "./login.js";

export function renderRegister(ctx) {
  return renderAuthForm(ctx, "register");
}
