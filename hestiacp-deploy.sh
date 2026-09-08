#!/bin/bash
# ==============================================================================
# S16 INDERT - Script de Despliegue Automatizado para HestiaCP (Linux / VPS)
# ==============================================================================
# Uso:
#   chmod +x hestiacp-deploy.sh
#   ./hestiacp-deploy.sh <usuario_hestia> <dominio> [puerto_opcional]
#
# Ejemplo:
#   ./hestiacp-deploy.sh admin s16.mi-comunidad.org 3000
# ==============================================================================

set -e

HESTIA_USER=${1:-"admin"}
DOMAIN=${2:-"localhost"}
PORT=${3:-3000}

echo "================================================================"
echo " 🏢 S16 INDERT - Despliegue Automático en HestiaCP"
echo "================================================================"
echo " 👤 Usuario HestiaCP : $HESTIA_USER"
echo " 🌐 Dominio Web       : $DOMAIN"
echo " 🔌 Puerto Interno    : $PORT"
echo "================================================================"

# 1. Comprobar Node.js y npm
if ! command -v node &> /dev/null; then
    echo "⚠️ Node.js no está instalado. Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js detectado: $NODE_VERSION"

# 2. Comprobar o instalar PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 Instalando PM2 globalmente para gestión de procesos..."
    npm install -g pm2
fi

# 3. Crear directorio de logs
mkdir -p logs data

# 4. Instalar dependencias del proyecto
echo "📦 Instalando dependencias de npm..."
npm install --silent

# 5. Compilar la aplicación (Frontend Vite + Backend Express CJS)
echo "🔨 Compilando aplicación para producción (Vite + TypeScript)..."
npm run build

# 6. Configurar permisos de base de datos SQLite
echo "📂 Configurando permisos de datos y almacenamiento..."
chmod -R 775 data
mkdir -p logs

# 7. Iniciar o recargar con PM2
echo "⚡ Iniciando/Recargando proceso con PM2..."
if pm2 describe comunidapp-s16 > /dev/null 2>&1; then
    echo "🔄 Recargando aplicación existente en PM2..."
    PORT=$PORT pm2 reload ecosystem.config.cjs --update-env
else
    echo "🚀 Registrando nueva aplicación en PM2..."
    PORT=$PORT pm2 start ecosystem.config.cjs
fi

pm2 save

# 8. Configurar Nginx en HestiaCP si el directorio existe
NGINX_CONF_DIR="/home/$HESTIA_USER/conf/web/$DOMAIN"
if [ -d "$NGINX_CONF_DIR" ]; then
    echo "⚙️ Configurando Nginx Reverse Proxy en $NGINX_CONF_DIR..."
    
    # Crear archivo include de Nginx para pasar el tráfico al puerto
    cat << 'EOF' > "$NGINX_CONF_DIR/nginx.ssl.conf_comunidapp"
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    client_max_body_size 20M;
}

location ~* \.(?:css|js|woff2?|svg|gif|png|jpe?g|ico|webp)$ {
    proxy_pass http://127.0.0.1:3000;
    expires 30d;
    add_header Cache-Control "public, max-age=2592000, immutable";
    access_log off;
}
EOF

    # Si existe nginx.conf estándar sin SSL
    cp "$NGINX_CONF_DIR/nginx.ssl.conf_comunidapp" "$NGINX_CONF_DIR/nginx.conf_comunidapp" || true

    # Recargar Nginx de HestiaCP
    if command -v systemctl &> /dev/null; then
        echo "🔄 Recargando Nginx..."
        systemctl reload nginx || true
    fi
fi

# 9. Ajustar permisos de usuario si no es root
if id "$HESTIA_USER" &>/dev/null; then
    echo "🔒 Ajustando propiedad a $HESTIA_USER:$HESTIA_USER..."
    chown -R "$HESTIA_USER:$HESTIA_USER" .
fi

echo ""
echo "================================================================"
echo "🎉 ¡Instalación y Despliegue completados con éxito!"
echo "================================================================"
echo "🌐 Acceso web: https://$DOMAIN (o http://$DOMAIN)"
echo "📊 Estado PM2: Ejecuta 'pm2 status' o 'pm2 logs comunidapp-s16'"
echo "💾 Base de Datos: SQLite 3 en ./data/sector16.sqlite"
echo "================================================================"
