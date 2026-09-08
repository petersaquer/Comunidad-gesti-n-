# 🚀 Guía de Instalación y Requisitos para HestiaCP (Linux / VPS)

Esta guía explica cómo desplegar y configurar **ComunidApp (Sector 16 INDERT)** en cualquier servidor VPS o dedicado con **Hestia Control Panel (HestiaCP)** de forma rápida, segura y compatible con su arquitectura full-stack (Node.js + Express + React + SQLite 3).

---

## 📋 1. Requisitos Previos del Servidor

### Requisitos de Hardware:
- **CPU:** 1 Core (vCPU) mínimo (Recomendado: 2 vCPUs).
- **Memoria RAM:** 1 GB mínimo (Recomendado: 2 GB RAM con 1 GB de SWAP).
- **Almacenamiento:** 5 GB de espacio libre en disco SSD/NVMe.

### Requisitos de Software:
- **Sistema Operativo:** Ubuntu 20.04 / 22.04 / 24.04 LTS o Debian 11 / 12 con **HestiaCP** instalado.
- **Node.js:** Versión 18.x LTS, 20.x LTS o 22.x LTS.
- **NPM:** Versión 9.x o superior.
- **PM2:** Gestor de procesos Node.js (se instala automáticamente con el script).
- **Servidor Web:** Nginx (incluido en la instalación por defecto de HestiaCP).

---

## ⚡ 2. Método Rápido: Despliegue en 1 Comando (Recomendado)

### Paso A: Crear el Dominio en HestiaCP (Interfaz Gráfica)
1. Inicia sesión en tu panel HestiaCP (`https://tu-ip:8083`).
2. Haz clic en **WEB** y luego en **+ Añadir Dominio Web** (por ejemplo: `comunidad.tudominio.com`).
3. En la configuración del dominio:
   - Marca **Habilitar soporte SSL** y selecciona **Usar Let's Encrypt para obtener SSL** (marca también soporte HTTPS automático).
   - Guarda los cambios.

### Paso B: Ejecutar el Script de Instalación por SSH
Conéctate por SSH a tu servidor como `root` o tu usuario de Hestia y ejecuta:

```bash
# 1. Entrar al directorio del dominio web en HestiaCP
cd /home/admin/web/comunidad.tudominio.com/public_html

# 2. Clonar o descomprimir los archivos de la aplicación aquí
git clone <URL_DE_TU_REPOSITORIO> .

# 3. Dar permisos de ejecución al script
chmod +x hestiacp-deploy.sh

# 4. Ejecutar el instalador automático indicando el usuario y tu dominio:
./hestiacp-deploy.sh admin comunidad.tudominio.com
```

El script se encargará automáticamente de:
- Instalar Node.js y PM2 si no están presentes.
- Instalar dependencias con `npm install`.
- Compilar el frontend (Vite) y el backend (Express/CJS).
- Crear las carpetas de datos `data/` y logs `logs/`.
- Iniciar la aplicación con PM2 (`pm2 start ecosystem.config.cjs`).
- Configurar el Reverse Proxy de Nginx en HestiaCP para que apunte al puerto `3000`.
- Asegurar que la aplicación inicie automáticamente al reiniciar el servidor (`pm2 save`).

---

## 🛠️ 3. Método Paso a Paso (Manual / Personalizado)

Si prefieres realizar cada paso de forma manual:

### 1. Instalar Node.js 20 LTS y PM2
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

### 2. Subir y Compilar la Aplicación
```bash
cd /home/admin/web/comunidad.tudominio.com/public_html

# Instalar dependencias
npm install

# Compilar proyecto
npm run build
```

### 3. Iniciar el Servicio con PM2
```bash
# Iniciar usando la configuración preconfigurada
pm2 start ecosystem.config.cjs

# Guardar estado para reinicios del servidor
pm2 save
pm2 startup
```

### 4. Configurar el Proxy Inverso en Nginx de HestiaCP
En HestiaCP, para redirigir las peticiones entrantes al backend de Node.js:

1. Crea el archivo de inclusión Nginx en la ruta de configuración del dominio:
   ```bash
   nano /home/admin/conf/web/comunidad.tudominio.com/nginx.ssl.conf_comunidapp
   ```
2. Pega el siguiente bloque:
   ```nginx
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
   ```
3. Copia también para el archivo no SSL si aplica:
   ```bash
   cp /home/admin/conf/web/comunidad.tudominio.com/nginx.ssl.conf_comunidapp /home/admin/conf/web/comunidad.tudominio.com/nginx.conf_comunidapp
   ```
4. Recarga Nginx:
   ```bash
   systemctl reload nginx
   ```

---

## 💾 4. Base de Datos SQLite y Copias de Seguridad

- **Ubicación del archivo SQLite:**  
  `/home/admin/web/comunidad.tudominio.com/public_html/data/sector16.sqlite`
- **Respaldos automáticos con Cron en HestiaCP:**
  Puedes agregar una tarea Cron en el panel HestiaCP para respaldar la base de datos diariamente:
  ```bash
  cp /home/admin/web/comunidad.tudominio.com/public_html/data/sector16.sqlite /home/admin/backups/sector16_$(date +\%F).sqlite
  ```
- **Descarga Directa desde la App:**  
  Los administradores pueden descargar la base de datos física `.sqlite` o el archivo Excel/JSON directamente desde la pestaña **Base de Datos SQLite** en la aplicación web.

---

## 📊 5. Comandos de Mantenimiento Útiles

| Acción | Comando |
|---|---|
| **Ver estado del proceso** | `pm2 status` |
| **Ver registros/logs en vivo** | `pm2 logs comunidapp-s16` |
| **Reiniciar la aplicación** | `pm2 restart comunidapp-s16` |
| **Detener la aplicación** | `pm2 stop comunidapp-s16` |
| **Recargar Nginx** | `sudo systemctl reload nginx` |
| **Actualizar a una nueva versión** | `git pull && npm install && npm run build && pm2 reload comunidapp-s16` |

---

## 🔒 6. Seguridad y Permisos
Asegúrate de que los archivos pertenezcan al usuario correspondiente de HestiaCP:
```bash
chown -R admin:admin /home/admin/web/comunidad.tudominio.com/public_html
chmod 775 /home/admin/web/comunidad.tudominio.com/public_html/data
```
