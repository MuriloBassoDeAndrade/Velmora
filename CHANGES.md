# Velmora — status da finalização

Este documento substitui as anotações antigas de atualização. Todos os caminhos são relativos à raiz do repositório.

## Concluído

### Backend
- Catálogo de produtos, categorias e características com validação por Form Requests, Resources e Services.
- Perfil: `PUT /api/user` permite atualizar nome/e-mail; troca de senha exige senha atual e confirmação.
- Carrinho de visitante e autenticado, com `X-Guest-Token`, controle de estoque e fusão automática no login/registro.
- Endereços e pedidos com isolamento por usuário.
- Checkout transacional: bloqueia linhas de produto, valida estoque, cria snapshots dos itens, decrementa estoque e esvazia o carrinho.
- Pagamento simulado e transições de status com HTTP 409 para transições inválidas.
- Rotas administrativas protegidas por middleware `admin`; listagem de produtos e pedidos paginada.
- Log de alterações administrativas de estoque e status de pedidos.
- Upload de imagens de produto (JPG/JPEG/PNG/WEBP, até 5 MB) para o disco público do Laravel; atualização remove o arquivo local anterior.
- Formato de erro padronizado para 400/401/403/404/409/419/422.

### Frontend
- Vitrine conectada a `GET /api/products`, com filtros de público e imagens do catálogo.
- Carrinho real conectado à API: adicionar, alterar quantidade, remover e preservar carrinho visitante via token.
- Login, cadastro, sessão por cookie, CSRF e edição de nome/e-mail.
- Checkout conectado à API: selecionar/cadastrar endereço, criar pedido e registrar pagamento simulado.
- Frete exibido de acordo com o backend: R$ 29,90.

### Infraestrutura e documentação
- Compose com containers separados para proxy Nginx, frontend, API e MySQL.
- Volume persistente para imagens públicas e volume separado para dados MySQL.
- Nginx do frontend corrigido e copiado para a imagem final.
- Limites de upload alinhados entre Nginx e PHP.
- `Dockerfile.dev` usa `artisan serve` somente no ambiente local; `api/Dockerfile` usa FrankenPHP para produção.
- `README.md` da raiz e `api/README.md` atualizados com instalação, arquitetura, regras e autenticação.
- Swagger UI em `/docs/` e especificação OpenAPI em `/openapi.yaml`.
- GitHub Actions executa a suíte Laravel com MySQL e o build do frontend.

## Regras de negócio importantes

- Preços e totais são calculados em centavos inteiros; recursos monetários retornam valores decimais em string.
- Produtos inativos ou indisponíveis não entram no total do carrinho; checkout bloqueia produto inativo ou estoque insuficiente.
- Frete fixo: R$ 29,90.
- Pedido nasce em `pending_payment`; pagamento é simulado.
- Transições: `pending_payment → paid | cancelled`, `paid → shipped`, `shipped → delivered`.
- Cancelamento permitido restaura o estoque.
- Usuários acessam apenas seus próprios endereços e pedidos; administrador acessa rotas administrativas.
- O cookie de sessão é host-only no Docker local. Em produção com HTTPS, configurar `SESSION_SECURE_COOKIE=true` e o domínio real em `SANCTUM_STATEFUL_DOMAINS`.

## Testes e verificação

- A suíte automatizada inclui testes de autenticação, perfil, catálogo, permissões administrativas, carrinho, endereços, pedidos, estoque e erros.
- Há um teste de regressão para dois clientes disputando a última unidade: somente um pedido é criado.
- O workflow de CI executa testes Laravel em MySQL e `npm run build` no frontend.
- O último workflow completo consultado concluiu com sucesso para backend e frontend. Alterações posteriores também acionaram novas execuções; consultar a aba Actions para o resultado do commit mais recente.
- O teste de checkout cobre concorrência pelo bloqueio transacional/estoque em requisições sequenciais. Uma simulação de requisições realmente paralelas continua sendo uma validação adicional de integração recomendada.

## Observações

- O pagamento continua demonstrativo; não existe gateway real integrado.
- O frontend cobre vitrine, carrinho, conta e checkout. A gestão administrativa está disponível pela API e Swagger, mas não há painel administrativo visual completo.
- Para rodar localmente, siga o README da raiz e defina `SEEDER_DEFAULT_PASSWORD` no `api/.env`.
