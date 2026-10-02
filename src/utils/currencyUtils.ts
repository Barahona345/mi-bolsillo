/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
 * Parsea un input de texto de usuario (ej: "12", "12.50", "12,5", "$20") a CENTAVOS ENTEROS.
 * Evita errores comunes de punto flotante de JavaScript mediante Math.round(val * 100).
 */
export function parseInputToCents(input: string): number {
  if (!input) return 0;
  // Limpiar caracteres extraños, reemplazar comas por puntos
  const clean = input.replace(/[^0-9.,]/g, '').replace(',', '.');
  const floatVal = parseFloat(clean);
  if (isNaN(floatVal) || floatVal <= 0) {
    return 0;
  }
  return Math.round(floatVal * 100);
}
