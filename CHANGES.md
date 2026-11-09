# Velmora: o que mudou nesta atualização

Todos os caminhos são relativos à raiz do repositório (a pasta que tem `api/` e `compose.yaml`).
Copie as pastas por cima, aceitando substituir. **Apague `api/tests/Feature/UpdateCartItemTest.php`**
(era só o `ExampleTest` do Laravel e testava a rota `/`, que não existe mais).

## 1. Dinheiro sem float
- Novo `app/Support/Money.php`: converte `"999.90"` para centavos inteiros, faz a conta com inteiros e formata de volta.
- `CartItem::subtotalCents()` / `Cart::totalCents()` concentram a regra; os Resources só formatam.
- Item indisponível vale `0.00` e **não entra no total** (regra que já estava no repositório).
- O total **inclui** item acima do estoque (veja o item 5), mas o checkout o recusa.

## 2. Catálogo
- `sort=recent` ordena por `id` decrescente (estável).
- Busca com `%` e `_` agora é literal (`LIKE ... ESCAPE '!'`, igual no MySQL e no SQLite).

## 3. Fusão de carrinhos
- `POST /api/cart/merge` devolve `{ "data": {carrinho}, "adjustments": [...] }` (mesmo `data` das outras rotas).
- **Login e registro também fundem** quando o frontend manda `X-Guest-Token`. A resposta é
  `{ "user", "cart", "adjustments" }`. Token ausente, inválido ou desconhecido é ignorado e não bloqueia o login.

## 4. Login por cookie (Sanctum SPA)
- `AuthService`/`AuthController` usam a sessão (guard `web`). Nenhum token é devolvido no corpo.
- Requisições de login/registro/logout precisam vir do frontend (`Origin`/`Referer` = `localhost`), senão 400.
- Fluxo do frontend:
  1. `GET /sanctum/csrf-cookie`
  2. `POST /api/login` (ou `/api/register`) com o header `X-XSRF-TOKEN` (valor do cookie `XSRF-TOKEN`) e `credentials: 'include'`
     (com axios: `withCredentials: true` e `withXSRFToken: true`)
  3. Chamadas seguintes só com o cookie. Sem o header CSRF a API responde 419.
- Postman/curl: mande o header `Referer: http://localhost` e faça o passo 1 antes.
- Verifiquei esse fluxo com o servidor rodando e `curl` (csrf-cookie → 419 sem header → 201 com header → `/api/user` → logout → 401).

## 5. Estoque no carrinho
- `CartItemResource` ganhou `exceeds_stock` (disponível, mas quantidade > estoque atual).
- `CartResource` ganhou `has_items_exceeding_stock`.

## 6. Pedidos (novo)
| Rota | Quem |
|---|---|
| `GET/POST /api/addresses`, `PUT/PATCH/DELETE /api/addresses/{id}` | autenticado (só os próprios) |
| `POST /api/orders` `{address_id}` | autenticado |
| `GET /api/orders`, `GET /api/orders/{id}` | dono (admin vê qualquer um) |
| `POST /api/orders/{id}/pay` | só o dono |
| `POST /api/orders/{id}/cancel` | dono ou admin |
| `GET /api/admin/orders?status=`, `GET /api/admin/orders/{id}` | admin |
| `PATCH /api/admin/orders/{id}/status` `{status: shipped|delivered|cancelled}` | admin |
| `PATCH /api/admin/products/{id}/stock` `{stock}` | admin |

Regras (`OrderService`, tudo em transação, produtos travados em ordem de id):
- Carrinho vazio, endereço que não é do usuário, produto inativo ou sem estoque suficiente: **422** (a mensagem cita o produto). Nada é gravado.
- Cria o pedido `pending_payment`, baixa o estoque, congela `product_name` e `unit_price`, esvazia o carrinho.
- Frete fixo de **R$ 29,90** (mesmo valor do `OrderSeeder`). Documente no README.
- Transições: `pending_payment → paid | cancelled`, `paid → shipped`, `shipped → delivered`. Qualquer outra: **409**.
- Pagar cria o `Payment` (método `simulated`, `paid_at` agora). `paid` só pelo `/pay`; o endpoint de status do admin recusa `paid` (422).
- Cancelar devolve o estoque (inclusive de produto apagado logicamente).
- Pedido de outro usuário: **403**. Endereço usado em pedido não pode ser excluído (422).

## 7. Formato de erro único (`bootstrap/app.php`)
- `{ "message": "..." }` para 401, 403, 404, 409 e demais; `{ "message", "errors": {...} }` para 422.
- 404 não vaza nome de model (`Resource not found.`).
- Cobre também o 419 (CSRF) e o 400 do login sem origem do frontend.

## 8. Estoque no admin
- Endpoint dedicado `PATCH /api/admin/products/{id}/stock` (`stock` inteiro de 0 a 1.000.000; funciona em produto inativo; usa lock).
- O `PUT` do produto continua podendo alterar o estoque.

## 9. Compose e `.env.example`
- `compose.yaml` (serviço `api`) e `api/.env.example` ganharam `APP_URL`, `SESSION_DRIVER`, `SESSION_DOMAIN`, `SESSION_SAME_SITE`,
  `SESSION_SECURE_COOKIE` e `SANCTUM_STATEFUL_DOMAINS=localhost`.
- Em produção (HTTPS e domínio real): `SESSION_SECURE_COOKIE=true` e `SANCTUM_STATEFUL_DOMAINS=<domínio do frontend>`.

## Testes
- 159 testes, 549 asserções, todos passando (rodei em SQLite; seu `phpunit.xml` usa o MySQL `velmora_test` dentro do Docker, que precisa existir com permissão).
- Novos: `AuthTest` (cookie), `AddressTest`, `OrderTest`, `AdminOrderTest`, `AdminStockTest`, `CartTotalsTest`, `CatalogTest`, `ErrorFormatTest`, `Unit/MoneyTest`
  e o helper `Concerns/CreatesCatalog`. Também estão aqui `CategoryTest`, `CharacteristicTest` e `ProductTest`.
- `CartControllerTest` só mudou a estrutura esperada do merge (`data` + `adjustments`).

## Para o README
Frete fixo; item indisponível fora do total; regra de fusão (soma limitada ao estoque, aviso em `adjustments`, carrinho de visitante apagado);
token de visitante gerado pela API e enviado em `X-Guest-Token`; login por cookie com CSRF.

## Continua pendente
Swagger/openapi, README, frontend, volume de uploads, `Dockerfile.dev` (ainda `artisan serve`) e edição do perfil (`PUT /api/user`).
