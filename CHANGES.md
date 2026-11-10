# Velmora — histórico da finalização

Todos os caminhos são relativos à raiz do repositório. Este arquivo registra o estado do projeto após a implementação das telas restantes do frontend.

## Backend — base existente mantida

- API REST Laravel 12 organizada em Controllers, Form Requests, Resources e Services.
- Autenticação por sessão/cookie com Sanctum, CSRF e papéis `customer` e `admin`.
- Catálogo público com busca, categoria, ordenação e paginação.
- Carrinho visitante identificado por `X-Guest-Token`, carrinho autenticado e fusão no login/registro.
- Endereços e pedidos com isolamento por usuário.
- Checkout transacional com bloqueio de estoque, snapshots de nome/preço, decremento e limpeza do carrinho.
- Pagamento simulado e transições válidas com HTTP 409 em conflitos.
- CRUD de produtos/categorias, atualização de estoque e endpoints administrativos protegidos.
- Upload de imagem de produto com validação e armazenamento persistente.
- Swagger UI em `/docs/` e OpenAPI em `/openapi.yaml`.

## Frontend — finalização das funcionalidades visuais

### Arquivos alterados
- `frontend/src/index.html`: estrutura principal, navegação, área dinâmica da aplicação, modais de carrinho/conta e rodapé.
- `frontend/src/script.js`: integração JavaScript com os endpoints da API e renderização das páginas.
- `frontend/src/styles/style.css`: identidade visual responsiva para desktop e dispositivos móveis.
- `frontend/Dockerfile`: recebe `VITE_API_URL` como argumento de build.
- `compose.yaml`: encaminha a variável `VITE_API_URL` para o build do frontend.
- `frontend/.env.example`: documenta a URL opcional da API e o destino do proxy Vite.

### Funcionalidades entregues
- Catálogo com busca por nome, filtro por categoria, ordenação por nome/preço/recência e paginação.
- Estado vazio com mensagem quando a busca não encontra produtos.
- Página própria em `/produto/{id}`, com descrição, preço, categoria, imagem, características, disponibilidade e quantidade limitada pelo estoque.
- Carrinho visitante e autenticado com atualização de quantidade, remoção, subtotal, total e indicador de quantidade.
- Login, registro, restauração da sessão, logout e retorno à página protegida após autenticação.
- Perfil com atualização de nome/e-mail/senha.
- Gerenciamento de endereços: listar, cadastrar, editar e excluir (respeitando bloqueio do backend para endereços usados em pedidos).
- Checkout com seleção ou cadastro de endereço, criação do pedido e redirecionamento ao detalhe do pedido.
- Histórico de pedidos, detalhe com itens/preços/endereço/status, pagamento simulado e cancelamento de pedido pendente.
- Painel visual de administração com cadastro/edição/exclusão lógica de produtos, upload de imagem, controle de estoque, CRUD de categorias e filtro/avanço de status dos pedidos.
- Navegação por URLs próprias: loja, produto, pedidos, pedido, perfil e painel; fallback SPA do Nginx atende recarga de rotas.
- Layout responsivo, mensagens de erro/sucesso e indicação explícita de pagamento demonstrativo.

## Documentação e configuração

- `README.md` atualizado com arquitetura, execução, credenciais de demonstração, regra de fusão, recursos do frontend, variáveis de ambiente, Docker, Swagger e orientações de produção.
- Contas de seed documentadas: `admin@velmora.com`, `ana@velmora.com`, `bruno@velmora.com` e `carla@velmora.com`. Todas usam a senha configurada localmente em `SEEDER_DEFAULT_PASSWORD`; nenhuma senha real é versionada.
- `VITE_API_URL` configurável no build. Vazio significa usar o proxy same-origin do Compose.

## Regras de negócio preservadas

- Preços e totais calculados no servidor e manipulados em centavos inteiros.
- Frete fixo de R$ 29,90.
- Pedido inicia em `pending_payment`; pagamento simulado não coleta cartão.
- Transições: `pending_payment → paid | cancelled`, `paid → shipped`, `shipped → delivered`.
- Cancelamento pendente restaura o estoque.
- Produtos usam exclusão lógica para preservar o histórico de pedidos.
- Administração protegida por autenticação e papel.

## Infraestrutura

- Um único `compose.yaml` com proxy, frontend, API e MySQL.
- Dockerfile único para frontend.
- `api/Dockerfile.dev` para desenvolvimento e `api/Dockerfile` de produção com FrankenPHP.
- Volumes persistentes para MySQL e imagens públicas.

## Verificações conhecidas

- Antes desta rodada, a suíte Laravel validada no MySQL registrou 166 testes e 573 asserções aprovadas; o build do frontend também havia passado.
- As alterações desta rodada foram feitas diretamente na branch `feature/backend-finalizacao` via GitHub. Elas ainda precisam ser baixadas e executadas no ambiente Docker local para validar build, testes, navegação e integração real.
- Não foi feita hospedagem pública. É o extra pontuado de +10 e deve ser considerado somente após validação local.
- O teste de concorrência existente verifica a proteção de estoque no fluxo automatizado, mas uma simulação de processos realmente paralelos pode ser uma validação adicional.
