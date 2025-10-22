# Use official PHP image with FPM
FROM php:8.4-fpm

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    git \
    curl \
    nano \
    && docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd

    # Install Composer
RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

# Set working directory
WORKDIR /var/www

# Copy composer files and install dependencies
COPY composer.lock composer.json ./
RUN composer install --no-autoloader --no-scripts

# Copy rest of the app
COPY . .

# Generate autoload files
RUN composer dump-autoload

# Expose PHP-FPM port
EXPOSE 9000

CMD ["php-fpm"]