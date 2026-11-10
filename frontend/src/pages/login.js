export function renderAuthForm(ctx, mode = "login") {
  const { currentUser, accountContent, esc } = ctx;
  if (currentUser) {
    accountContent.innerHTML = '<div class="account-summary"><p>Conectado como</p><strong>' + esc(currentUser.name) + '</strong><span>' + esc(currentUser.email) + '</span><a class="text-link" href="/perfil" data-link>Gerenciar perfil →</a><button class="outline-btn" id="logoutButton" type="button">Sair da conta</button></div>';
    return;
  }
  const registering = mode === "register";
  accountContent.innerHTML = '<form id="authForm" class="form-grid">' +
    (registering ? '<label class="wide">Nome<input name="name" required maxlength="50" autocomplete="name"></label>' : '') +
    '<label class="wide">E-mail<input name="email" type="email" required autocomplete="email"></label><label class="wide">Senha<input name="password" type="password" minlength="8" required autocomplete="' + (registering ? "new-password" : "current-password") + '"></label>' +
    (registering ? '<label class="wide">Confirmar senha<input name="password_confirmation" type="password" minlength="8" required></label>' : '') +
    '<button class="solid-btn wide" type="submit">' + (registering ? "Criar conta" : "Entrar") + '</button></form><button class="text-link auth-switch" data-auth-mode="' + (registering ? "login" : "register") + '">' + (registering ? "Já tenho uma conta" : "Ainda não tenho conta") + '</button>';
}
