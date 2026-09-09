# 🇵🇾 S16 - Plataforma Comunitaria de Gestión Barrial, Censo y Transparencia INDERT

Plataforma integral de autogestión vecinal, censo de ocupantes, expedientes del **INDERT (Instituto Nacional de Desarrollo Rural y de la Tierra)**, control biométrico/QR de asambleas, tesorería comunitaria transparente y prevención de ocupaciones irregulares en asentamientos de la República del Paraguay.

---

## 🌟 Características Principales y Novedades del Sistema

### 1. 🏛️ Sistema de Asambleas Soberanas, Control QR & Régimen de Asistencia
- **Acreditación en Tiempo Real con Cámara:** Módulo integrado con lector óptico de códigos QR (`html5-qrcode`) que valida la presencia del titular mediante el escaneo de su Carnet Digital Comunitario o mediante búsqueda por Cédula de Identidad en milisegundos.
- **Obligatoriedad y Valor Jurídico para el INDERT:** Según la Ley N° 1863/02 (Estatuto Agrario), la titulación de lotes fiscales exige comprobar arraigo continuo y pacífico. Las actas de asistencia a asambleas constituyen la prueba documental primordial exigida por los peritos del INDERT para certificar posesión real frente a ocupaciones especulativas.
- **Representación Soberana del Lote:** 
  - Vota exclusivamente el titular censado o su cónyuge/concubino/a acreditado en la ficha familiar (un voto por lote).
  - Queda estrictamente prohibida la representación cruzada, el voto acumulado o el porte de carnets de terceros.
- **Régimen Disciplinario por Faltas:**
  - *1 Falta Injustificada:* Notificación de advertencia preventiva en el portal *Mi Cuenta / Mi Lote*.
  - *2 Faltas Consecutivas:* Apercibimiento formal y suspensión temporal del derecho a voz y voto en la asamblea subsiguiente.
  - *3 Faltas Consecutivas (o 5 alternadas en el año):* Pérdida de prelación social, presunción de falta de arraigo y facultad de la Comisión para inspección in situ y remisión de informe negativo al INDERT para eventual reasignación de la parcela.
- **Protocolo de Justificación (72 horas):** En caso de enfermedad comprobada o causa laboral justificada, el vecino dispone de 72 horas hábiles para presentar certificado médico o constancia ante la Secretaría de Actas, asentándose como *"Ausente con Justificativo"*.
- **Actas Censales Homologadas en Excel (`.xlsx`):** Generación automática de planillas oficiales para el INDERT con orden por Manzana/Lote, cálculo de quorum, estados `PRESENTE` o `AUSENTE (FALTA)` y cuadros de firma de la Mesa Directiva.
- **Convocatorias Formales por WhatsApp:** Plantillas solemnes automatizadas de citación con fecha, hora oficial de Paraguay, lugar físico y orden del día estipulado.

### 2. ⏰ Estandarización al Horario Oficial de Paraguay (`America/Asuncion`)
- **Reloj Oficial en Vivo:** Indicador en tiempo real en el encabezado principal con la fecha y hora oficial de la República del Paraguay (UTC-4 estándar / UTC-3 horario de verano por Decreto del Poder Ejecutivo).
- **Trazabilidad Horaria Inmutable:** Todas las actas de asambleas, recibos de tesorería, balances y censos se fechan con el calendario oficial paraguayo (`DD/MM/YYYY HH:mm`), evitando desfasajes de servidores externos con billeteras electrónicas (Tigo Money, Billetera Personal, transferencias bancarias SIPAP).

### 3. 🪪 Carnet Digital del Residente con Código QR
- **Credencial Digital Única:** Cada vecino dispone en su portal **"Mi Cuenta / Mi Lote"** de su carnet digital con nombre, Cédula de Identidad enmascarada para privacidad, Manzana y Lote asignados, estado de linderos amojonados y un Código QR individual para trámites comunales y asambleas.
- **Estado de Cuenta Vecinal:** Consulta instantánea de aportes sociales (cuotas de energía eléctrica ANDE, red de agua potable, mensura judicial) y estado de solvencia comunitaria.

### 4. ☁️ Persistencia Segura en la Nube con Google Cloud Firestore
- **Sincronización en Tiempo Real:** 11 colecciones de datos sincronizadas permanentemente (`residents`, `meetings`, `contributions`, `expenses`, `shifts`, `incidents`, `users`, `indert_docs`, `land_requests`, `posts`, `relocation_records`) junto con los parámetros institucionales (`settings/general`).
- **Filosofía de "Libro Abierto":** Padrón y balances accesibles las 24 horas por cualquier vecino para garantizar máxima transparencia y evitar desvíos de fondos.
- **Reglas de Seguridad (`firestore.rules`):** Lectura comunitaria pública de transparencia y escritura autenticada y validada según esquemas de datos.

### 5. 🔄 Registro Histórico Inmutable de Reubicaciones y Permutas
- **Trazabilidad Perpetua de Parcelas:** Registro detallado de cualquier cambio de lote por apertura de calles, tendido eléctrico o causa justificada, archivando fecha oficial paraguaya, Manzana Anterior, Manzana Nueva, motivo y número de resolución de la Comisión Vecinal.
- **Prevención de Estafas:** Impide la reventa clandestina, dobles ocupaciones o asignaciones paralelas de terrenos.

### 6. 🛡️ Blindaje Anti-Fraude & Normativa Legal INDERT
- **Conformidad Jurídica:** Diseñado en concordancia con el Estatuto Agrario (**Ley N° 1863/02**) y la Carta Orgánica del INDERT (**Ley N° 2419/04**).
- **Detección de Duplicados:** Alertas inmediatas ante números de C.I. duplicados o adjudicaciones simultáneas de más de un lote a una misma persona o cónyuge.

### 7. 💰 Tesorería y Balances Comunitarios en Guaraníes (`Gs.`)
- **Caja Chica y Liquidación en Vivo:** Control estricto de ingresos por aportes comunales y egresos rendidos con comprobante/factura.
- **Descarga de Balances en Excel y PDF:** Reportes financieros formales con desglose de rubros y cuadro de firmas de Presidente y Tesorera.
- **Recibos Digitales Numerados:** Cada pago genera un recibo digital transparente con firma digital comunitaria.

### 8. 📄 Guía Comunitaria Oficial Imprimible en PDF
- Generador de PDF institucional (5+ páginas) con bandera tricolor de Paraguay, escala de prioridades sociales de adjudicación, régimen de faltas en asambleas, glosario de términos agrarios y descargos legales.

---

## 👥 Roles de Usuario y Matriz de Permisos (RBAC)

| Rol | Descripción | Permisos Clave |
| :--- | :--- | :--- |
| **Administrador General (Presidente)** | Representante legal de la Comisión Vecinal Pro-Tierra | Control total del sistema, otorgamiento de permisos, edición de parámetros, censos y finanzas |
| **Tesorera Comunal** | Responsable de fondos y balances del asentamiento | Cobro de aportes, emisión de recibos digitales, carga de facturas de gastos y rendición de cuentas |
| **Secretaria de Actas** | Custodia de expedientes y documentación comunal | Convocatoria a asambleas, escaneo de asistencia QR, exportación de actas en Excel, expedientes INDERT |
| **Delegado de Manzana** | Líder barrial por sector o manzana asignada | Verificación de lotes de su manzana, registro de turnos de limpieza comunitaria y canalización de reclamos |
| **Vecino / Residente** | Titular u ocupante censado en el padrón | Acceso a su Carnet Digital QR, consulta de estado de cuenta, recibos emitidos, asambleas y muro de noticias |

---

## 🛠️ Pila Tecnológica (Tech Stack)

- **Frontend:** React 18, TypeScript, Tailwind CSS, Lucide React, Motion.
- **Generación Documental:** jsPDF (Certificados y Guía PDF), SheetJS / XLSX (Actas y Balances en Excel).
- **Hardware & QR:** `html5-qrcode` para lectura óptica de códigos QR y códigos de barra con cámara de smartphone o webcam.
- **Backend Serverless / API:** Node.js con Express (`api/index.ts` y `server.ts`).
- **Base de Datos & Nube:** Google Cloud Firestore (NoSQL en tiempo real) y Firebase Authentication (Google Sign-In & Email/Password).
- **Local Fallback:** SQLite 3 (`better-sqlite3`) y LocalStorage para trabajo offline o local.
- **Formato Local:** `es-PY` y huso horario `America/Asuncion`.

---

## 🚀 Despliegue en Servidores

### Opción A: Despliegue en Vercel (Producción Serverless)
Consulta la guía completa en [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md).
- El frontend se compila a archivos estáticos de alta velocidad en `dist/`.
- La API corre sobre Vercel Functions (`api/index.ts`).
- Los datos se resguardan permanentemente en **Google Cloud Firestore**.

### Opción B: Despliegue en VPS / Servidor Dedicado con HestiaCP (Linux)
Consulta la guía completa en [DEPLOY_HESTIACP.md](DEPLOY_HESTIACP.md).
- Script automático en un solo comando: `./hestiacp-deploy.sh admin tu-dominio.com`.
- Ejecución continua gestionada por **PM2** (`ecosystem.config.cjs`).
- Proxy inverso de alto rendimiento mediante **Nginx** con certificado SSL gratuito Let's Encrypt.

---

## 💻 Instalación y Desarrollo Local

```bash
# 1. Clonar el repositorio
git clone <URL_DEL_REPOSITORIO>
cd comunidapp

# 2. Instalar dependencias
npm install

# 3. Iniciar el servidor de desarrollo (puerto 3000)
npm run dev

# 4. Validar tipos y linter
npm run lint

# 5. Compilar para producción
npm run build
```

---

## ⚖️ Descargo Legal Institucional

> **USO INTERNO COMUNITARIO:** Esta plataforma tecnológica es una iniciativa privada de autogestión ciudadana creada para la administración interna de la Comisión Vecinal Pro-Tierra. **NO constituye una plataforma oficial dependiente del INDERT ni de ministerios del Estado Paraguayo.** Las constancias y certificados emitidos acreditan posesión social pacífica y cumplimiento de aportes comunitarios vecinales conforme a las facultades gremiales consagradas en la Constitución Nacional de la República del Paraguay.
