# 🚀 Despliegue en Vercel (Serverless)

Esta guía explica cómo desplegar la aplicación en Vercel, utilizando su infraestructura Serverless.

## 1. Configuración de Repositorio
Para desplegar en Vercel, lo más rápido es subir el código a un repositorio de GitHub, GitLab o Bitbucket.

## 2. Archivos Incluidos
El proyecto ya incluye el archivo `vercel.json` y la carpeta `api/` pre-configurada. 
- Vercel detectará el archivo `vercel.json` automáticamente y usará el motor Serverless de Node.js para compilar tu backend Express en una Vercel Function (Serverless Function).
- El frontend en React + Vite será compilado como archivos estáticos a gran velocidad.

## 3. Limitaciones en Vercel (¡Importante!)
Debido a que Vercel utiliza un sistema de archivos de solo lectura (Serverless), **la base de datos SQLite no mantendrá los datos permanentemente**.
En el entorno Serverless, la base de datos se crea en `/tmp/data` (memoria temporal). Cada vez que la función se suspenda por inactividad, los datos ingresados en la aplicación (Nuevos residentes, pagos, etc.) se perderán y se reiniciarán a los datos de prueba.

### ¿Cómo solucionar esto?
Si deseas usar Vercel en Producción Real, debes cambiar la base de datos SQLite local por una base de datos externa en la nube (ej: Google Cloud SQL Postgres, Supabase o Firebase).

## 4. Comandos de Despliegue por CLI
Si prefieres no usar GitHub, puedes instalar Vercel CLI en tu computadora y desplegar directamente desde la terminal:

```bash
# 1. Instalar Vercel CLI globalmente
npm i -g vercel

# 2. Iniciar sesión en Vercel
vercel login

# 3. Desplegar el proyecto
vercel --prod
```
