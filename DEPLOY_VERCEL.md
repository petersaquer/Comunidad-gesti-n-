# 🚀 Despliegue en Vercel (Producción & Serverless)

Esta guía explica cómo desplegar **S16 - ComunidApp (Gestión Comunitaria e INDERT)** en Vercel, con soporte completo de persistencia en la nube mediante **Google Cloud Firestore** y **Firebase Authentication**.

---

## 📋 1. Arquitectura en Vercel

El proyecto está diseñado como una **Single Page Application (SPA)** de alto rendimiento con backend Serverless:
- **Frontend:** React 18 + Vite + Tailwind CSS + Lucide Icons + jsPDF. Se compila a archivos estáticos en `dist/` servidos a través de la red global de borde (Edge CDN) de Vercel.
- **Backend API:** Express compilado como Vercel Serverless Function (`api/index.ts`), gestionando rutas `/api/*`.
- **Base de Datos & Persistencia:** **Google Cloud Firestore** en tiempo real. Todos los censos, asambleas con QR, recibos de tesorería, expedientes y fotos se guardan de forma permanente e inmutable en Firestore, garantizando que **no haya pérdida de datos entre invocaciones serverless**.
- **Autenticación:** Firebase Auth (Email/Contraseña y Google Sign-In) con roles de seguridad (Presidente, Tesorera, Secretaria, Delegado y Vecino).

---

## ⚡ 2. Despliegue Rápido desde GitHub / GitLab (Recomendado)

1. Sube el código fuente a tu repositorio en **GitHub**, **GitLab** o **Bitbucket**.
2. Ingresa a tu panel de [Vercel](https://vercel.com/) y haz clic en **"Add New... > Project"**.
3. Importa tu repositorio.
4. En **Framework Preset**, Vercel detectará automáticamente **Vite**.
5. Los comandos de build y salida están preconfigurados:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
6. En la sección **Environment Variables (Variables de Entorno)**, añade las variables de Firebase (opcional si usas la configuración por defecto de `src/firebase.ts`):
   ```env
   NODE_ENV=production
   ```
7. Haz clic en **"Deploy"**. En menos de 2 minutos tu aplicación estará online con HTTPS automático.

---

## 💻 3. Despliegue Directo por Vercel CLI

Si prefieres desplegar directamente desde tu terminal local:

```bash
# 1. Instalar Vercel CLI globalmente
npm i -g vercel

# 2. Iniciar sesión en tu cuenta de Vercel
vercel login

# 3. Vincular y desplegar en modo producción
vercel --prod
```

---

## 🗄️ 4. Persistencia Garantizada con Firebase Firestore

A diferencia de las bases de datos de archivo local (`sqlite`), la aplicación sincroniza todas sus entidades directamente con **Google Cloud Firestore**:
- `residents`: Padrón comunal con manzanas, lotes y cédulas.
- `meetings`: Asambleas generales con actas y control de asistencia QR.
- `contributions`: Ingresos y recibos digitales numerados.
- `expenses`: Egresos rendidos con factura/comprobante.
- `shifts`: Turnos comunitarios y faenas barriales.
- `incidents`: Reclamos vecinales y avisos de seguridad.
- `users`: Cuentas y permisos administrativos (RBAC).
- `indert_docs`: Expedientes y resoluciones oficiales del INDERT.
- `land_requests`: Solicitudes y postulaciones a parcelas.
- `posts`: Muro comunitario y comunicados oficiales.
- `relocation_records`: Historial inmutable de reubicaciones y permutas.
- `settings/general`: Parámetros de la comisión, expediente matriz INDERT y nombres de autoridades.

---

## ⚙️ 5. Configuración de `vercel.json`

El archivo `vercel.json` en la raíz del proyecto ya incluye el enrutamiento para soportar tanto las Serverless Functions como el enrutamiento SPA del frontend:

```json
{
  "version": 2,
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Esto asegura que las rutas del navegador se resuelvan correctamente sin errores 404.
