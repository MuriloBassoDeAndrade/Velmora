export function requireUser(user, onUnauthenticated) {
  if (user) return true;
  onUnauthenticated?.();
  return false;
}

export function requireAdmin(user, onUnauthorized) {
  if (user?.role === "admin") return true;
  onUnauthorized?.();
  return false;
}
