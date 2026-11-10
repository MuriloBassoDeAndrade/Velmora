# Velmora

Loja virtual de relógios desenvolvida como projeto acadêmico. O frontend utiliza HTML, CSS e JavaScript puro; o backend é uma API REST em Laravel 12, com MySQL e Docker.

## Tecnologias e decisões

- **Frontend:** HTML semântico, CSS responsivo e JavaScript puro. Não utiliza Blade nem framework frontend.
- **Backend:** Laravel 12 organizado em Controllers, Form Requests, Resources e Services. Os Services concentram regras de negócio e acesso ao banco.
- **Banco:** MySQL 8.4, com migrations, relacionamentos, índices e seeders.
- **Autenticação:** sessão por cookie com Laravel Sanctum, proteção CSRF e papéis `customer` e `admin`.
- **Infraestrutura:** Docker Compose separa proxy Nginx, frontend, API e MySQL.
- **Servidor:** o container de produção da API usa FrankenPHP. `php artisan serve` aparece somente no Dockerfile de desenvolvimento.

## Estrutura

```text
Velmora/
├── Proxy/                 # Nginx de entrada: /api, /sanctum, /docs e /storage
├── api/                   # Laravel REST API
│   ├── app/Http           # Controllers, Requests, Resources e middleware
│   ├── app/Services       # Regras de negócio e acesso ao banco
│   ├── database           # Migrations, factories e seeders
│   └── public             # Swagger UI e openapi.yaml
├── frontend/
│   ├── index.html          # página inicial
│   ├── pages/              # HTML separado para cada tela
│   ├── src/
│   │   ├── api/             # comunicação com a API Laravel (Axios)
│   │   ├── pages/           # renderização e lógica de cada tela
│   │   ├── components/      # componentes HTML reutilizáveis
│   │   ├── utils/           # formatação, guards e armazenamento
│   │   ├── styles/          # CSS base e componentes
│   │   └── main.js          # inicialização e eventos globais
│   └── public/images/       # imagens estáticas públicas
├── mysql/init/            # Inicialização do banco de testes
└── compose.yaml
```

### Organização do frontend

Os documentos HTML ficam em `frontend/index.html` e `frontend/pages/`. O JavaScript fica separado em `frontend/src/`: os módulos de `api/` conversam com o Laravel, `pages/` contém a renderização de cada tela e `main.js` coordena a inicialização e os eventos compartilhados. O Vite gera as páginas HTML como entradas independentes.

## Executar localmente

Requisitos: Docker Desktop com Docker Compose e Git.

1. Clone o repositório:
   ```bash
   git clone https://github.com/MuriloBassoDeAndrade/Velmora.git
   cd Velmora
   ```
2. Crie o ambiente da API:
   ```bash
   cp api/.env.example api/.env
   ```
3. Edite `api/.env` e configure `SEEDER_DEFAULT_PASSWORD`. A mesma senha de desenvolvimento será aplicada às contas de demonstração. Não use senha de produção.
4. Suba os containers:
   ```bash
   docker compose up --build -d
   ```
5. Gere a chave, execute migrations e seeders:
   ```bash
   docker compose exec api php artisan key:generate
   docker compose exec api php artisan migrate --seed
   ```
6. Acesse:
   - Loja: [http://localhost](http://localhost)
   - Swagger UI: [http://localhost/docs/](http://localhost/docs/)
   - OpenAPI: [http://localhost/openapi.yaml](http://localhost/openapi.yaml)

### Contas de demonstração

Os seeders criam as seguintes contas. A senha de todas é o valor definido em `SEEDER_DEFAULT_PASSWORD` no `api/.env`.

| Papel | E-mail |
|---|---|
| Administrador | `admin@velmora.com` |
| Cliente | `ana@velmora.com` |
| Cliente | `bruno@velmora.com` |
| Cliente | `carla@velmora.com` |

Não coloque senhas reais no Git. Essas credenciais destinam-se somente ao ambiente acadêmico local.

## Frontend e URL da API

O frontend usa `VITE_API_URL` como base opcional da API. Quando a variável está vazia, usa caminhos relativos (`/api` e `/sanctum`) através do proxy Nginx do Compose — configuração recomendada para o ambiente local e para publicação no mesmo domínio.

Para um endpoint separado, configure `VITE_API_URL` no ambiente que executa o build e reconstrua o frontend:

```bash
VITE_API_URL=https://api.seu-dominio.example docker compose build frontend
docker compose up -d
```

O arquivo `frontend/.env.example` documenta também `VITE_API_PROXY_TARGET`, usado apenas pelo servidor de desenvolvimento do Vite. Se frontend e API estiverem em domínios diferentes, configure CORS, cookies, HTTPS e `SANCTUM_STATEFUL_DOMAINS` adequadamente.

## Funcionalidades implementadas

### Loja e catálogo
- Catálogo público com busca por nome, filtro por categoria, ordenação por nome/preço/data e paginação.
- Página própria para cada produto, com descrição, preço, categoria, características, imagem e disponibilidade.
- Quantidade limitada ao estoque; produto inativo ou sem estoque não pode ser adicionado.
- Mensagem explícita quando a busca não encontra resultados.

### Carrinho e autenticação
- Carrinho de visitante persistido no servidor e identificado pelo header `X-Guest-Token`; o frontend guarda o token no `localStorage`.
- Carrinho de usuário persistido na conta, com adicionar, alterar quantidade e remover.
- Login, registro, logout, restauração da sessão e edição de perfil.
- Fusão automática do carrinho visitante no login/registro. Produtos iguais têm quantidades somadas, limitadas ao estoque; o backend retorna ajustes quando necessário e invalida o carrinho/token de visitante após a fusão.

### Checkout, pedidos e endereços
- Cadastro, edição e exclusão de endereços próprios; endereço utilizado por pedido não pode ser excluído.
- Checkout autenticado com seleção ou cadastro de endereço.
- Frete fixo de **R$ 29,90**.
- Pedido criado como `pending_payment`, dentro de transação; estoque é bloqueado e decrementado e o carrinho é esvaziado.
- Nome e preço unitário são congelados em cada item do pedido.
- Pagamento explicitamente simulado, sem gateway e sem solicitar ou armazenar dados de cartão.
- Histórico, detalhes e cancelamento de pedidos pendentes; cancelamento restaura o estoque.

### Administração
- Painel visual protegido por papel `admin`.
- CRUD de produtos, upload de imagem JPG/JPEG/PNG/WEBP (até 5 MB), URL de imagem, ativação/desativação e exclusão lógica.
- CRUD de categorias. A API impede excluir categoria ainda utilizada por produtos.
- Atualização de estoque.
- Listagem administrativa de pedidos, filtro por status e avanço `paid → shipped → delivered`.
- A API também oferece endpoints de administração documentados no Swagger.

## Regras de negócio importantes

- O total do carrinho e do pedido é calculado pelo servidor; valores monetários são manipulados em centavos inteiros, sem ponto flutuante para cálculos.
- Carrinho: um carrinho ativo por usuário; a combinação carrinho + produto é única; adicionar produto existente soma quantidade; quantidade zero remove.
- A fusão soma as quantidades e limita ao estoque disponível. Os ajustes são enviados na resposta do login/registro.
- Checkout: todas as verificações, criação do pedido, cópia dos itens e baixa de estoque ocorrem em transação. Se um item falhar, a transação é revertida.
- Status: `pending_payment → paid → shipped → delivered`; pedido pendente também pode ir para `cancelled`. Transições inválidas retornam HTTP 409.
- Somente o dono do pedido pode pagar. Dono ou administrador pode consultar/cancelar conforme as regras da API.
- Produtos usam exclusão lógica para preservar referências históricas.
- Rotas administrativas exigem sessão válida e papel `admin`.

## Rotas e documentação

A documentação interativa completa está em [Swagger UI](/docs/) e a especificação está em [openapi.yaml](/openapi.yaml).

| Grupo | Prefixos principais |
|---|---|
| Autenticação e perfil | `/api/register`, `/api/login`, `/api/logout`, `/api/user` |
| Catálogo | `/api/products`, `/api/categories`, `/api/characteristics` |
| Carrinho | `/api/cart`, `/api/cart/items` |
| Endereços | `/api/addresses` |
| Pedidos | `/api/orders` |
| Administração | `/api/admin`, além de CRUD protegido de produtos/categorias |

## Seeders

`DatabaseSeeder` executa CategorySeeder, CharacteristicSeeder, UserSeeder, ProductSeeder, AddressSeeder, CartSeeder e OrderSeeder. O ambiente de demonstração inclui administrador, três clientes, categorias, ao menos 30 produtos, exemplos sem estoque e inativos, carrinho visitante e de usuário e pedidos em diferentes estados.

Para recriar os dados do zero em ambiente local, use com cuidado:

```bash
docker compose exec api php artisan migrate:fresh --seed
```

Esse comando apaga e recria as tabelas do banco configurado; não execute em produção.

## Docker e persistência

- `compose.yaml` é o único Compose e sobe MySQL, API, frontend e proxy.
- `frontend/Dockerfile` constrói os arquivos estáticos e os serve por Nginx.
- `api/Dockerfile.dev` é para desenvolvimento; `api/Dockerfile` usa FrankenPHP para produção.
- `mysql_data` persiste o banco.
- `api_public_storage` persiste imagens enviadas.
- O proxy encaminha `/api`, `/sanctum`, `/docs`, `/openapi.yaml` e `/storage` para a API.

### Banco de testes e testes automatizados

O script `mysql/init/01-create-test-database.sql` cria `velmora_test` em uma inicialização nova do volume. Se o volume já existia antes da inclusão do script, crie o banco uma vez:

```bash
docker compose exec mysql mysql -uroot -prootpassword -e "CREATE DATABASE IF NOT EXISTS velmora_test; GRANT ALL PRIVILEGES ON velmora_test.* TO 'Velmora'@'%'; FLUSH PRIVILEGES;"
```

Execute os testes Laravel:

```bash
docker compose exec api php artisan test
```

A CI previamente validada executou **166 testes e 573 asserções** no MySQL e concluiu o build do frontend. Após novas alterações, execute novamente os comandos de teste e build antes da entrega.

## Produção e hospedagem

A hospedagem é um extra de avaliação, não faz parte do funcionamento local. Para publicar, configure HTTPS, banco de produção, segredos fora do repositório, domínio real em `SANCTUM_STATEFUL_DOMAINS`, `SESSION_SECURE_COOKIE=true`, CORS/cookies conforme a origem, migrations, seeders/catálogo e backups dos volumes. Teste o fluxo em janela anônima e em outro dispositivo. Nunca publique credenciais padrão do Compose ou use o servidor de desenvolvimento PHP em produção.
