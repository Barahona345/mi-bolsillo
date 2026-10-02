/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Retorna la fecha del lunes correspondiente a la semana de la fecha dada (en hora local).
 * La semana va de lunes a domingo.
 */
export function getMondayOfWeek(d: Date = new Date()): Date {
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = target.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
  // Si es domingo (0), retroceder 6 días. Si es lunes (1), 0 días. Si es martes (2), 1 día, etc.
  const diffToMonday = day === 0 ? -6 : 1 - day;
  target.setDate(target.getDate() + diffToMonday);
  return target;
}

/**
 * Retorna la clave de la semana usando la fecha del lunes en formato "YYYY-MM-DD".
 * Ejemplo para la semana actual: "2026-09-28"
 */
export function getWeekKey(d: Date = new Date()): string {
  const monday = getMondayOfWeek(d);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const day = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Obtiene el rango de fechas (Lunes a Domingo) para una clave de semana "YYYY-MM-DD".
 */
export function getWeekDateRange(weekKey: string): { start: Date; end: Date; label: string } {
  // Manejo de compatibilidad en caso de formato "YYYY-MM-DD"
  const [yearStr, monthStr, dayStr] = weekKey.split('-');
  const monday = new Date(parseInt(yearStr, 10), parseInt(monthStr, 10) - 1, parseInt(dayStr, 10));

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = monday.toLocaleDateString('es-ES', options);
  const endStr = sunday.toLocaleDateString('es-ES', { ...options, year: 'numeric' });

  return {
    start: monday,
    end: sunday,
    label: `${startStr} - ${endStr}`,
  };
}

/**
 * Cambia la semana en un delta (-1 para semana anterior, +1 para semana siguiente).
 */
export function shiftWeekKey(weekKey: string, deltaWeeks: number): string {
  const { start } = getWeekDateRange(weekKey);
  const nextDate = new Date(start);
  nextDate.setDate(nextDate.getDate() + deltaWeeks * 7);
  return getWeekKey(nextDate);
}

/**
 * Formatea la fecha de un gasto guardado en formato amigable para estudiantes.
 */
export function formatExpenseDate(isoDateStr: string): string {
  try {
    const date = new Date(isoDateStr);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

    if (isToday) {
      return `Hoy ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday =
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Ayer ${timeStr}`;
    }

    const dayName = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
    return `${dayName} ${timeStr}`;
  } catch {
    return 'Reciente';
  }
}
