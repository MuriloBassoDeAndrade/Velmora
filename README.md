# Velmora

Loja virtual de relógios construída como projeto acadêmico, com frontend em HTML, CSS e JavaScript puro, API REST em Laravel 12, MySQL e ambiente Docker.

## Tecnologias e decisões

- **Frontend:** HTML semântico, CSS e JavaScript puro. A interface consome a API por HTTP e não usa Blade.
- **Backend:** Laravel 12 organizado em Controllers, Form Requests, Resources e Services. As regras de negócio e o acesso aos dados ficam nos Services.
- **Banco:** MySQL 8.4, com migrations, relacionamentos e seeders.
- **Infraestrutura local:** Docker Compose separa frontend, API, banco e proxy Nginx.
- **Servidor de aplicação:** o ambiente local usa o servidor de desenvolvimento do PHP. A imagem de produção em `api/Dockerfile` usa FrankenPHP; não use `php artisan serve` em produção.

## Estrutura

```text
Velmora/
├── Proxy/                 # Nginx de entrada: /api e /sanctum para a API
├── api/                   # Laravel REST API
│   ├── app/Http           # Controllers, Requests, Resources e middleware
│   ├── app/Services       # Regras de negócio e acesso ao banco
│   ├── database           # Migrations, factories e seeders
│   └── public             # Swagger UI e especificação OpenAPI
├── frontend/              # HTML, CSS e JavaScript puro
├── mysql/init/            # Inicialização do banco de testes
└── compose.yaml
```

## Requisitos

- Docker Desktop com Docker Compose
- Git

## Executar localmente

1. Clone o repositório e entre na pasta:
   ```bash
   git clone https://github.com/MuriloBassoDeAndrade/Velmora.git
   cd Velmora
   ```
2. Crie o arquivo de ambiente:
   ```bash
   cp api/.env.example api/.env
   ```
3. Edite `api/.env` e defina uma senha de desenvolvimento em `SEEDER_DEFAULT_PASSWORD`. Não use credenciais de produção nesse arquivo.
4. Suba os containers:
   ```bash
   docker compose up --build -d
   ```
5. Gere a chave da aplicação, execute migrations e seeders:
   ```bash
   docker compose exec api php artisan key:generate
   docker compose exec api php artisan migrate --seed
   ```
6. Acesse:
   - Loja: [http://localhost](http://localhost)
   - Swagger UI: [http://localhost/docs/](http://localhost/docs/)
   - OpenAPI: [http://localhost/openapi.yaml](http://localhost/openapi.yaml)

O endpoint administrativo de produtos aceita upload de imagens JPG/JPEG/PNG/WEBP de até 5 MB ou uma URL externa. Os arquivos enviados são armazenados no disco público do Laravel e servidos por `/storage/`. O volume `api_public_storage` mantém imagens enviadas mesmo quando os containers são recriados. O volume `mysql_data` mantém os dados do banco.

### Banco de testes

O script `mysql/init/01-create-test-database.sql` cria `velmora_test` e concede acesso ao usuário `Velmora` durante a inicialização de um volume MySQL novo. Se o volume já existia antes da inclusão do script, execute uma vez:

```bash
docker compose exec mysql mysql -uroot -prootpassword -e "CREATE DATABASE IF NOT EXISTS velmora_test; GRANT ALL PRIVILEGES ON velmora_test.* TO 'Velmora'@'%'; FLUSH PRIVILEGES;"
```

Execute os testes:

```bash
docker compose exec api php artisan test
```

Os testes usam o banco `velmora_test`, separado do banco de desenvolvimento `Velmora`.

## Autenticação e segurança

A API usa autenticação por sessão/cookie com Laravel Sanctum no modo SPA. Não há token bearer no corpo da resposta.

Para login, registro, logout e requisições autenticadas que alteram dados:

1. Faça `GET /sanctum/csrf-cookie`.
2. Leia o cookie `XSRF-TOKEN` e envie seu valor decodificado no header `X-XSRF-TOKEN`.
3. Envie cookies com `credentials: 'include'`.
4. Em requisições autenticadas, o navegador envia o cookie de sessão automaticamente.

O carrinho de visitante recebe o header `X-Guest-Token` na primeira consulta. O frontend guarda esse UUID e o reenvia nas operações do carrinho. Login/registro podem fundir o carrinho visitante à conta; quantidades são limitadas ao estoque e ajustes são retornados na resposta.

## Regras principais da loja

- O catálogo público lista somente produtos ativos.
- Preços e totais são calculados em centavos inteiros para evitar erros de ponto flutuante.
- Produtos indisponíveis não entram no total do carrinho; o checkout recusa produtos inativos ou com estoque insuficiente.
- O frete é fixo em **R$ 29,90**.
- Ao criar pedido, o estoque é reservado, o nome/preço do produto são copiados para os itens do pedido e o carrinho é esvaziado.
- O pagamento é simulado, sem integração com gateway real.
- Fluxo de status: `pending_payment → paid → shipped → delivered`; um pedido pendente também pode ser cancelado. Cancelamento permitido restaura o estoque.
- Usuários só acessam seus próprios endereços e pedidos. Rotas administrativas exigem usuário autenticado com papel `admin`.

## Rotas

A documentação completa e interativa está no Swagger UI em `/docs/`. Principais grupos:

| Grupo | Prefixo |
|---|---|
| Autenticação e perfil | `/api/register`, `/api/login`, `/api/logout`, `/api/user` |
| Catálogo | `/api/products`, `/api/categories`, `/api/characteristics` |
| Carrinho | `/api/cart` |
| Endereços | `/api/addresses` |
| Pedidos | `/api/orders` |
| Administração | `/api/admin` |

## Produção

A imagem de produção da API está em `api/Dockerfile` e usa FrankenPHP com PHP 8.4 e dependências sem `require-dev`. Para produção, configure HTTPS, `SESSION_SECURE_COOKIE=true`, os domínios corretos em `SANCTUM_STATEFUL_DOMAINS`, segredos fora do repositório, logs/monitoramento e backups dos volumes. Não publique as credenciais padrão do Compose nem use o servidor de desenvolvimento do PHP.
