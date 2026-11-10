# API Velmora

API REST do e-commerce Velmora, construída com Laravel 12 e PHP 8.4.

A documentação de endpoints fica no Swagger UI em [http://localhost/docs/](http://localhost/docs/) e na especificação [public/openapi.yaml](public/openapi.yaml).

## Organização

- `app/Http/Controllers`: camada HTTP, mantém controllers enxutos.
- `app/Http/Requests`: validação e autorização de entrada.
- `app/Http/Resources`: formato de saída JSON.
- `app/Services`: regras de negócio e operações de banco de dados.
- `app/Models`: entidades e relacionamentos Eloquent.
- `database/migrations`: estrutura do banco.
- `database/seeders`: dados demonstrativos.

## Executar pelo Docker

Na raiz do repositório:

```bash
cp api/.env.example api/.env
# Defina SEEDER_DEFAULT_PASSWORD no arquivo api/.env.
docker compose up --build -d
docker compose exec api php artisan key:generate
docker compose exec api php artisan migrate --seed
```

## Testes

```bash
docker compose exec api php artisan test
```

O PHPUnit aponta para o banco separado `velmora_test`. O Compose cria esse banco em uma instalação MySQL nova por meio de `mysql/init/01-create-test-database.sql`.

## Autenticação

O frontend usa sessão/cookie do Laravel Sanctum (SPA). Obtenha o cookie CSRF por `GET /sanctum/csrf-cookie`, envie o valor decodificado de `XSRF-TOKEN` no header `X-XSRF-TOKEN` e mantenha `credentials: 'include'` no fetch. O login/registro fundem o carrinho visitante quando recebem `X-Guest-Token`.

## Regras de negócio

- Valores monetários são tratados em centavos inteiros.
- Frete fixo: R$ 29,90.
- Pagamento é simulado.
- Checkout e alterações de estoque são transacionais e usam bloqueio de linhas.
- Transições inválidas de pedido retornam HTTP 409.
- Rotas administrativas exigem middleware `admin`.
