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

Requisitos: Docker Desktop com Docker Compose v2 e Git. Não é necessário instalar PHP, Composer, Node.js ou MySQL na máquina: as dependências e serviços rodam nos containers.

1. Clone o repositório:
   ```bash
   git clone https://github.com/MuriloBassoDeAndrade/Velmora.git
   cd Velmora
   ```
2. Crie o ambiente da API (PowerShell):
   ```powershell
   Copy-Item api/.env.example api/.env
   ```
   Em Linux, macOS ou Git Bash, use `cp api/.env.example api/.env`. O `.env.example` já define uma senha local para os seeders; não use essa senha em produção.
3. Na raiz do projeto, suba os containers:
   ```bash
   docker compose up --build -d
   ```
   O Compose inicia MySQL, API, frontend e proxy. Aguarde o serviço `api` ficar saudável:
   ```bash
   docker compose ps
   ```
4. Gere a chave da aplicação e crie/popule o banco:
   ```bash
   docker compose exec api php artisan key:generate
   docker compose exec api php artisan migrate --seed
   ```
5. Acesse a loja em [http://localhost](http://localhost), o painel Swagger em [http://localhost/api/docs](http://localhost/api/docs) e o arquivo OpenAPI em [http://localhost/api/docs/openapi.yaml](http://localhost/api/docs/openapi.yaml).

Para percorrer o fluxo demonstrativo, entre como cliente, adicione produtos ao carrinho, informe ou cadastre um endereço no checkout e confirme o pagamento simulado. Depois, entre com a conta de administrador para consultar pedidos e avançar os status permitidos. O Swagger documenta as demais rotas.

### Contas de demonstração

Os seeders criam as seguintes contas. Em uma instalação nova seguindo as instruções acima, todas usam a senha local `VelmoraLocal2026!`, definida por `SEEDER_DEFAULT_PASSWORD` em `api/.env.example`:

| Papel | E-mail | Senha local |
|---|---|---|
| Administrador | `admin@velmora.com` | `VelmoraLocal2026!` |
| Cliente | `ana@velmora.com` | `VelmoraLocal2026!` |
| Cliente | `bruno@velmora.com` | `VelmoraLocal2026!` |
| Cliente | `carla@velmora.com` | `VelmoraLocal2026!` |

Essas credenciais são somente para demonstração local. Não use a senha de exemplo em produção nem armazene credenciais reais no Git. Se `SEEDER_DEFAULT_PASSWORD` for alterada no `api/.env`, os seeders usarão o novo valor.

## Frontend e URL da API

O frontend usa `VITE_API_URL` como base opcional da API. No Compose local, não é preciso configurar essa variável: vazia, o frontend usa caminhos relativos (`/api` e `/sanctum`) através do proxy Nginx.

Se for executar o frontend diretamente com Vite (`npm run dev`), crie `frontend/.env` com os valores abaixo. `VITE_API_PROXY_TARGET` deve apontar para uma API acessível pela máquina que executa o Vite; ajuste o endereço/porta conforme a forma como a API foi iniciada. Esse arquivo local é opcional e não é necessário para executar o projeto pelo Docker Compose.

```env
VITE_API_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:8000
```

Para usar um endpoint separado, `VITE_API_URL` é lida durante o build. No PowerShell:

```powershell
$env:VITE_API_URL = "https://api.seu-dominio.example"
docker compose build frontend
Remove-Item Env:VITE_API_URL
docker compose up -d
```

No Linux, macOS ou Git Bash:

```bash
VITE_API_URL=https://api.seu-dominio.example docker compose build frontend
docker compose up -d
```

Se frontend e API estiverem em domínios diferentes, configure CORS, cookies, HTTPS e `SANCTUM_STATEFUL_DOMAINS` adequadamente.

## Funcionalidades implementadas

### Loja e catálogo
- Catálogo público com busca por nome, filtro por categoria, ordenação por nome/preço/data e paginação.
- Gênero limitado a Masculino, Feminino ou Unissex; relógios Unissex também aparecem nas coleções Masculino e Feminino.
- Página própria para cada produto, com descrição, preço, categoria, características, imagem e disponibilidade.
- Quantidade limitada ao estoque; produto inativo ou sem estoque não pode ser adicionado.
- Mensagem explícita quando a busca não encontra resultados.

### Carrinho e autenticação
- Carrinho de visitante persistido no servidor e identificado pelo header `X-Guest-Token`. Na primeira consulta ao carrinho, a API gera o token e o devolve nesse header; o frontend o guarda em `localStorage` e o envia nas próximas requisições do carrinho.
- Carrinho de usuário persistido na conta, com adicionar, alterar quantidade e remover.
- Login, registro, logout, restauração da sessão e edição de perfil. A autenticação usa sessão por cookie: o frontend obtém o cookie CSRF em `GET /sanctum/csrf-cookie`, envia seu valor no header `X-XSRF-TOKEN` em requisições que alteram dados e inclui os cookies da sessão (`withCredentials`/`credentials: include`).
- Fusão automática no login/registro: itens existentes apenas no carrinho visitante são copiados; se o mesmo produto já estiver no carrinho da conta, as quantidades são somadas e limitadas ao estoque. Se o limite reduzir a quantidade, a API informa o ajuste em `adjustments`. Produtos indisponíveis são descartados da fusão; ao concluí-la, o carrinho visitante é removido e o frontend apaga seu token.
- Produto removido, inativo ou sem estoque permanece visível no carrinho como indisponível, mas seu subtotal é zero e ele não entra no total. O cliente pode removê-lo; o checkout não cria pedido se houver item indisponível ou estoque insuficiente.

### Checkout, pedidos e endereços
- Cadastro, edição e exclusão de endereços próprios; endereço utilizado por pedido não pode ser excluído.
- Checkout autenticado com seleção ou cadastro de endereço.
- Frete fixo de **R$ 29,90 por pedido**, somado ao subtotal dos itens válidos.
- Pedido criado como `pending_payment`, dentro de transação; estoque é bloqueado e decrementado e o carrinho é esvaziado.
- Nome e preço unitário são congelados em cada item do pedido.
- Pagamento explicitamente simulado, sem gateway e sem solicitar ou armazenar dados de cartão.
- Histórico paginado de pedidos, detalhes e cancelamento de pedidos pendentes; cancelamento restaura o estoque.

### Administração
- Painel visual protegido por papel `admin`.
- CRUD de produtos, upload de imagem JPG/JPEG/PNG/WEBP (até 5 MB), ativação/desativação e exclusão lógica.
- Ao editar as características, o registro existente é atualizado se pertencer apenas ao produto; se outros produtos também o utilizarem, é criada uma cópia para preservar os dados deles.
- CRUD de categorias. A API bloqueia a exclusão de categoria ainda utilizada por produtos; é necessário reatribuir ou remover esses produtos primeiro.
- Atualização de estoque.
- Listagem administrativa de pedidos, filtro por status e avanço `paid → shipped → delivered`.
- A API também oferece endpoints de administração documentados no Swagger.

## Regras de negócio importantes

- O total do carrinho e do pedido é calculado pelo servidor; valores monetários são manipulados em centavos inteiros, sem ponto flutuante para cálculos.
- Carrinho: um carrinho ativo por usuário; a combinação carrinho + produto é única; adicionar produto existente soma quantidade; quantidade zero remove.
- Fusão de carrinhos: copia itens exclusivos do visitante; soma produtos repetidos e limita cada quantidade ao estoque atual; informa reduções em `adjustments`; descarta itens de produtos removidos/inativos/sem estoque e remove o carrinho visitante após a fusão.
- Itens indisponíveis no carrinho têm subtotal zero e são sinalizados ao cliente. Itens cuja quantidade excede o estoque também são sinalizados; o checkout valida novamente e não cria parcialmente o pedido se qualquer item falhar.
- Checkout: todas as verificações, criação do pedido, cópia dos itens e baixa de estoque ocorrem em transação. Se um item falhar, a transação é revertida.
- Frete: valor único e fixo de R$ 29,90 por pedido.
- Status: `pending_payment → paid → shipped → delivered`; de `pending_payment` também é permitido ir para `cancelled`. `delivered` e `cancelled` são estados finais. Transições inválidas retornam HTTP 409.
- Somente o dono do pedido pode pagar. Dono ou administrador pode consultar/cancelar conforme as regras da API.
- Produtos usam exclusão lógica para preservar referências históricas.
- Rotas administrativas exigem sessão válida e papel `admin`.

## Rotas e documentação

A documentação interativa completa está em [Swagger UI](http://localhost/api/docs) e a especificação está em [openapi.yaml](http://localhost/api/docs/openapi.yaml). O Swagger documenta as rotas efetivamente usadas, incluindo autenticação, catálogo, carrinho, endereços, pedidos e administração.

No fluxo de sessão do navegador, o frontend primeiro solicita `/sanctum/csrf-cookie`, envia o token do cookie `XSRF-TOKEN` em `X-XSRF-TOKEN` para operações de escrita e mantém os cookies de sessão nas requisições. Para visitantes, o token do carrinho vem da API pelo header `X-Guest-Token`, fica no `localStorage` e acompanha as próximas chamadas do carrinho.

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
- O proxy encaminha `/api`, incluindo `/api/docs` e seus assets, além de `/sanctum` e `/storage` para a API.

### Banco de testes e testes automatizados

O script `mysql/init/01-create-test-database.sql` cria `velmora_test` em uma inicialização nova do volume. Se o volume já existia antes da inclusão do script, crie o banco uma vez:

```bash
docker compose exec mysql mysql -uroot -prootpassword -e "CREATE DATABASE IF NOT EXISTS velmora_test; GRANT ALL PRIVILEGES ON velmora_test.* TO 'Velmora'@'%'; FLUSH PRIVILEGES;"
```

Execute os testes Laravel (a configuração de testes usa o banco `velmora_test`):

```bash
docker compose exec api php artisan test
```

Última execução verificada: **174 testes passaram, com 611 asserções**.

O banco `velmora_test` é criado pelo script de inicialização do MySQL quando o volume é criado pela primeira vez. Se você já tinha um volume antes desse script, crie o banco uma vez usando o comando acima. Os testes limpam e recriam tabelas nesse banco; não configure o banco de produção para testes.

## Produção e hospedagem

A hospedagem é um extra de avaliação, não faz parte do funcionamento local. Para publicar, configure HTTPS, banco de produção, segredos fora do repositório, domínio real em `SANCTUM_STATEFUL_DOMAINS`, `SESSION_SECURE_COOKIE=true`, CORS/cookies conforme a origem, migrations, seeders/catálogo e backups dos volumes. Teste o fluxo em janela anônima e em outro dispositivo. Nunca publique credenciais padrão do Compose ou use o servidor de desenvolvimento PHP em produção.
