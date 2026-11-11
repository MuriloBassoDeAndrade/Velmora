export function formDataToObject(form) {
  return Object.fromEntries(new FormData(form).entries());
}
