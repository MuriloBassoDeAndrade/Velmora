
FROM dunglas/frankenphp:php8.4-trixie

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

# Instala as extensões PHP necessárias
RUN install-php-extensions \
    pdo_mysql \
    zip \
    bcmath \
    opcache \
    mbstring \
    xml

WORKDIR /app

# Copia o projeto Laravel
COPY . .

# Instala as dependências de produção
RUN composer install --no-dev --optimize-autoloader --no-interaction \
    && composer check-platform-reqs --no-dev

# Ativa as configurações de produção do PHP
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini" && ln -s ../storage/app/public public/storage

# Configura o servidor para utilizar HTTP na porta 80
ENV SERVER_NAME=:80

EXPOSE 80
