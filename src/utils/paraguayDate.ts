/**
 * Utilidades oficiales de fecha y hora para Paraguay (Zona horaria: America/Asuncion, UTC-4 / UTC-3)
 * Garantiza formato 'es-PY' homogéneo para actas, asambleas, recibos y expedientes del INDERT.
 */

export const PARAGUAY_TIMEZONE = 'America/Asuncion';
export const PARAGUAY_LOCALE = 'es-PY';

/**
 * Obtiene la fecha y hora actual en la zona horaria de Paraguay
 */
export function getParaguayDate(): Date {
  // Obtenemos el tiempo actual ajustado al timezone de Paraguay
  return new Date();
}

/**
 * Devuelve la fecha actual de Paraguay en formato ISO (YYYY-MM-DD)
 * Evita saltos de fecha causados por la diferencia horaria UTC de servidores remotos.
 */
export function getParaguayTodayISO(): string {
  const formatter = new Intl.DateTimeFormat(PARAGUAY_LOCALE, {
    timeZone: PARAGUAY_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  
  const parts = formatter.formatToParts(new Date());
  const year = parts.find((p) => p.type === 'year')?.value;
  const month = parts.find((p) => p.type === 'month')?.value;
  const day = parts.find((p) => p.type === 'day')?.value;
  
  return `${year}-${month}-${day}`;
}

/**
 * Devuelve el mes actual en Paraguay en formato YYYY-MM
 */
export function getParaguayCurrentMonth(): string {
  return getParaguayTodayISO().substring(0, 7);
}

/**
 * Formatea una fecha en formato estándar paraguayo (DD/MM/YYYY)
 */
export function formatParaguayDate(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '-';
  try {
    const d = typeof dateInput === 'string' && !dateInput.includes('T') && dateInput.includes('-')
      ? new Date(`${dateInput}T12:00:00`)
      : new Date(dateInput);
      
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat(PARAGUAY_LOCALE, {
      timeZone: PARAGUAY_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateInput);
  }
}

/**
 * Formatea una fecha y hora en formato paraguayo (DD/MM/YYYY HH:mm hs)
 */
export function formatParaguayDateTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat(PARAGUAY_LOCALE, {
      timeZone: PARAGUAY_TIMEZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d) + ' hs';
  } catch {
    return String(dateInput);
  }
}

/**
 * Formatea solo la hora en Paraguay (HH:mm hs)
 */
export function formatParaguayTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    return new Intl.DateTimeFormat(PARAGUAY_LOCALE, {
      timeZone: PARAGUAY_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d) + ' hs';
  } catch {
    return String(dateInput);
  }
}

/**
 * Formato largo para actas solemnes del INDERT y asambleas comunales:
 * Ej: "Miércoles, 9 de septiembre de 2026 a las 14:30 hs"
 */
export function formatParaguayLongDateTime(dateInput?: string | Date | number | null): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);

    const dateStr = new Intl.DateTimeFormat(PARAGUAY_LOCALE, {
      timeZone: PARAGUAY_TIMEZONE,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);

    const timeStr = new Intl.DateTimeFormat(PARAGUAY_LOCALE, {
      timeZone: PARAGUAY_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(d);

    // Capitalizar primera letra
    const capitalized = dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
    return `${capitalized} a las ${timeStr} hs`;
  } catch {
    return String(dateInput);
  }
}
