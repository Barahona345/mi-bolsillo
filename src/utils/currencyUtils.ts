/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Límite máximo para gastos o meta semanal: $10,000.00 (1,000,000 de centavos)
export const MAX_AMOUNT_CENTS = 1_000_000;

/**
 * Convierte centavos enteros a formato legible con signo de dólar ($X.XX).
 * Ejemplo: 100 centavos -> "$1.00", 2000 centavos -> "$20.00"
 */
export function formatCents(cents: number): string {
  const safeCents = Math.round(Number(cents) || 0);
  const dollars = (safeCents / 100).toFixed(2);
  return `$${dollars}`;
}

/**
 * Formato corto si no tiene decimales (ej: $4 en vez de $4.00), o completo si los tiene.
 */
export function formatCentsCompact(cents: number): string {
  const safeCents = Math.round(Number(cents) || 0);
  if (safeCents % 100 === 0) {
    return `$${safeCents / 100}`;
  }
  return formatCents(cents);
}

/**
 * Parsea un input de texto de usuario a CENTAVOS ENTEROS de forma estricta.
 * Soporta coma decimal ("5,50"), rechaza negativos, ceros y números astronómicos.
 */
export function parseInputToCents(input: string): number {
  if (!input || typeof input !== 'string') return 0;

  // Reemplazar coma por punto y quitar espacios
  const trimmed = input.trim().replace(',', '.');

  // Validar formato numérico estándar (hasta 2 decimales opcionales)
  // Rechaza texto con letras, notación científica 'e' o múltiples puntos
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
    // Si tiene más de dos decimales o caracteres no permitidos, intentamos evaluar si es parseable
    const parts = trimmed.split('.');
    if (parts.length === 2 && parts[1].length > 2) {
      // Tiene más de 2 decimales
      return -1; // Código especial de error: más de 2 decimales
    }
  }

  const floatVal = parseFloat(trimmed);
  if (isNaN(floatVal) || floatVal <= 0) {
    return 0;
  }

  const cents = Math.round(floatVal * 100);

  // Evitar números gigantescos
  if (cents > MAX_AMOUNT_CENTS) {
    return -2; // Código especial: excede límite máximo permitido ($10,000)
  }

  return cents;
}
