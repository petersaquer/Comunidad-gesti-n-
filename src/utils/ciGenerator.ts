/**
 * Generador de imágenes de muestra para Cédula de Identidad Paraguaya (Frente y Dorso)
 * Permite previsualizar ambos lados del documento con diseño oficial paraguayo.
 */

export const generateSampleCIDocument = (
  fullName: string,
  documentId: string,
  side: 'frente' | 'dorso',
  options?: {
    maritalStatus?: string;
    nationality?: string;
    birthDate?: string;
  }
): string => {
  const statusText = (options?.maritalStatus || 'SOLTERO/A').toUpperCase();
  const natText = (options?.nationality || 'PARAGUAYA').toUpperCase();

  if (side === 'frente') {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 315" width="500" height="315">
      <defs>
        <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f4f7f6"/>
          <stop offset="50%" stop-color="#e8f0ec"/>
          <stop offset="100%" stop-color="#dce9e2"/>
        </linearGradient>
        <pattern id="guilloche" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="10" cy="10" r="8" fill="none" stroke="#d0ded6" stroke-width="0.5"/>
        </pattern>
      </defs>
      <!-- Base Card -->
      <rect width="500" height="315" rx="16" fill="url(#bgGrad)" stroke="#1e3a8a" stroke-width="2"/>
      <rect width="500" height="315" rx="16" fill="url(#guilloche)" opacity="0.6"/>

      <!-- Header Ribbon (Tricolor Paraguaya) -->
      <rect x="0" y="0" width="500" height="6" fill="#d92525" rx="16"/>
      <rect x="0" y="6" width="500" height="6" fill="#ffffff"/>
      <rect x="0" y="12" width="500" height="6" fill="#0038a8"/>

      <!-- Header Text -->
      <text x="250" y="34" font-family="system-ui, sans-serif" font-size="12" font-weight="900" text-anchor="middle" fill="#1e3a8a" letter-spacing="1">REPÚBLICA DEL PARAGUAY</text>
      <text x="250" y="48" font-family="system-ui, sans-serif" font-size="9" font-weight="700" text-anchor="middle" fill="#475569">POLICÍA NACIONAL • DEPARTAMENTO DE IDENTIFICACIONES</text>
      <text x="250" y="62" font-family="system-ui, sans-serif" font-size="11" font-weight="800" text-anchor="middle" fill="#0f172a" letter-spacing="0.5">CÉDULA DE IDENTIDAD CIVIL</text>

      <!-- Photo Box -->
      <rect x="24" y="76" width="120" height="150" rx="8" fill="#cbd5e1" stroke="#64748b" stroke-width="1.5"/>
      <!-- Silhouette in photo -->
      <circle cx="84" cy="125" r="28" fill="#94a3b8"/>
      <path d="M44 195 C44 165, 124 165, 124 195 Z" fill="#94a3b8"/>
      <rect x="24" y="202" width="120" height="24" fill="#0f172a" opacity="0.8" rx="0 0 8 8"/>
      <text x="84" y="218" font-family="system-ui, sans-serif" font-size="10" font-weight="800" text-anchor="middle" fill="#ffffff">FRENTE / ANVERSO</text>

      <!-- Fields -->
      <text x="160" y="90" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#64748b">NOMBRES Y APELLIDOS</text>
      <text x="160" y="108" font-family="system-ui, sans-serif" font-size="13" font-weight="800" fill="#0f172a">${fullName.toUpperCase()}</text>

      <text x="160" y="132" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#64748b">CÉDULA DE IDENTIDAD (C.I.) N°</text>
      <text x="160" y="152" font-family="system-ui, sans-serif" font-size="16" font-weight="900" fill="#1e3a8a">${documentId}</text>

      <text x="160" y="174" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#64748b">NACIONALIDAD</text>
      <text x="160" y="190" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#1e293b">${natText}</text>

      <text x="280" y="174" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#64748b">ESTADO CIVIL</text>
      <text x="280" y="190" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#1e293b">${statusText}</text>

      <text x="390" y="174" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#64748b">SEXO</text>
      <text x="390" y="190" font-family="system-ui, sans-serif" font-size="11" font-weight="700" fill="#1e293b">M / F</text>

      <!-- Bottom bar & Verification Chip -->
      <rect x="24" y="240" width="452" height="54" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <text x="36" y="258" font-family="system-ui, sans-serif" font-size="8" font-weight="800" fill="#64748b">COMISIÓN VECINAL INDERT • REGISTRO DE PADRÓN</text>
      <text x="36" y="274" font-family="monospace" font-size="11" font-weight="700" fill="#0f172a">IDPY&lt;&lt;${documentId.replace(/[^0-9]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <circle cx="445" cy="267" r="16" fill="#10b981" opacity="0.2"/>
      <path d="M438 267 L443 272 L452 262" fill="none" stroke="#059669" stroke-width="2.5" stroke-linecap="round"/>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  } else {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 500 315" width="500" height="315">
      <defs>
        <linearGradient id="bgGradBack" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8fafc"/>
          <stop offset="100%" stop-color="#e2e8f0"/>
        </linearGradient>
      </defs>
      <!-- Base Card Back -->
      <rect width="500" height="315" rx="16" fill="url(#bgGradBack)" stroke="#334155" stroke-width="2"/>

      <!-- Header Ribbon -->
      <rect x="0" y="0" width="500" height="6" fill="#d92525" rx="16"/>
      <rect x="0" y="6" width="500" height="6" fill="#ffffff"/>
      <rect x="0" y="12" width="500" height="6" fill="#0038a8"/>

      <!-- Header -->
      <text x="250" y="32" font-family="system-ui, sans-serif" font-size="11" font-weight="800" text-anchor="middle" fill="#1e293b">DORSO / REVERSO DEL DOCUMENTO</text>
      <text x="250" y="46" font-family="system-ui, sans-serif" font-size="9" font-weight="600" text-anchor="middle" fill="#64748b">C.I. N° ${documentId} • CONSTANCIA DE IDENTIFICACIÓN</text>

      <!-- Fingerprint Box -->
      <rect x="28" y="60" width="105" height="135" rx="8" fill="#ffffff" stroke="#94a3b8" stroke-width="1"/>
      <text x="80" y="78" font-family="system-ui, sans-serif" font-size="7" font-weight="800" text-anchor="middle" fill="#64748b">IMPRESIÓN DACTILAR</text>
      <!-- Stylized fingerprint -->
      <path d="M80 90 Q65 110 80 130 Q95 110 80 90 M75 98 Q60 115 75 138 M85 98 Q100 115 85 138 M70 106 Q55 125 70 148 M90 106 Q105 125 90 148" fill="none" stroke="#475569" stroke-width="1.8" stroke-linecap="round"/>
      <text x="80" y="184" font-family="system-ui, sans-serif" font-size="7" font-weight="700" text-anchor="middle" fill="#94a3b8">PULGAR DERECHO</text>

      <!-- Signatures Box -->
      <rect x="145" y="60" width="327" height="85" rx="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="1"/>
      <text x="220" y="75" font-family="system-ui, sans-serif" font-size="7" font-weight="800" fill="#64748b">FIRMA DEL TITULAR</text>
      <path d="M160 110 Q210 85 240 105 T290 100" fill="none" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
      <line x1="160" y1="120" x2="290" y2="120" stroke="#94a3b8" stroke-width="0.5"/>

      <text x="340" y="75" font-family="system-ui, sans-serif" font-size="7" font-weight="800" fill="#64748b">FIRMA DE LA AUTORIDAD</text>
      <path d="M330 108 Q370 90 410 105 T440 98" fill="none" stroke="#0038a8" stroke-width="1.8" stroke-linecap="round"/>
      <line x1="330" y1="120" x2="445" y2="120" stroke="#94a3b8" stroke-width="0.5"/>
      <text x="387" y="132" font-family="system-ui, sans-serif" font-size="7" font-weight="600" text-anchor="middle" fill="#64748b">Dir. Identificaciones</text>

      <!-- Details -->
      <rect x="145" y="152" width="327" height="43" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1"/>
      <text x="160" y="168" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#475569">VIGENCIA: 10 AÑOS • EXPEDIDO EN ASUNCIÓN, PARAGUAY</text>
      <text x="160" y="184" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#059669">DOCUMENTO HABILITADO PARA TRAMITACIÓN DE LOTE INDERT</text>

      <!-- MRZ Barcode Machine Readable Zone -->
      <rect x="28" y="205" width="444" height="90" rx="8" fill="#0f172a"/>
      <text x="45" y="235" font-family="Courier, monospace" font-size="13" font-weight="700" fill="#38bdf8" letter-spacing="2">I&lt;PRY${documentId.replace(/[^0-9]/g, '')}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
      <text x="45" y="260" font-family="Courier, monospace" font-size="13" font-weight="700" fill="#38bdf8" letter-spacing="2">8501018M3312314PRY&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;8</text>
      <text x="45" y="285" font-family="Courier, monospace" font-size="13" font-weight="700" fill="#38bdf8" letter-spacing="2">${fullName.replace(/\s+/g, '&lt;').toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }
};
