/**
 * Utilidades de Moneda en Guaraníes Paraguayos (Gs. / ₲)
 * Regla: Sin comas ni decimales. Los miles se separan por puntos (ej: Gs. 50.000, Gs. 1.250.000).
 */

export const formatGuaranies = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return 'Gs. 0';
  }
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Gs. ${formatted}`;
};

export const formatGuaraniesNumber = (amount: number | undefined | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  const rounded = Math.round(amount);
  return rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

/**
 * Convierte un texto con puntos a número limpio
 */
export const parseGuaranies = (value: string | number): number => {
  if (typeof value === 'number') return Math.round(value);
  const cleaned = value.replace(/\./g, '').replace(/[^0-9-]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
};
