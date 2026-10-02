/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Retorna la clave de semana tipo "2026-W40" en hora local (semana de lunes a domingo).
 * Sigue el estándar ISO 8601 donde la semana inicia el lunes.
 */
export function getWeekKey(d: Date = new Date()): string {
  // Crear fecha local sin horas para evitar problemas de desfase horario
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate());

  // En JS: Domingo=0, Lunes=1, ..., Sábado=6.
  // Convertimos a: Lunes=1 ... Domingo=7
  const dayNr = target.getDay() === 0 ? 7 : target.getDay();

  // El jueves de la misma semana determina el año ISO
  target.setDate(target.getDate() + 4 - dayNr);
  const yearStart = new Date(target.getFullYear(), 0, 1);

  // Calcular el número de semana
  const dayOfYear = Math.floor((target.getTime() - yearStart.getTime()) / 86400000) + 1;
  const weekNumber = Math.ceil(dayOfYear / 7);

  const year = target.getFullYear();
  const weekPadded = String(weekNumber).padStart(2, '0');

  return `${year}-W${weekPadded}`;
}

/**
 * Obtiene el rango de fechas (Lunes a Domingo) para una clave de semana "YYYY-Www".
 */
export function getWeekDateRange(weekKey: string): { start: Date; end: Date; label: string } {
  const parts = weekKey.split('-W');
  const year = parseInt(parts[0], 10);
  const week = parseInt(parts[1], 10);

  // 4 de enero siempre está en la semana 1 según ISO
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() === 0 ? 7 : jan4.getDay();

  // Lunes de la semana 1
  const week1Monday = new Date(year, 0, 4 - jan4Day + 1);

  // Lunes de la semana solicitada
  const targetMonday = new Date(week1Monday.getTime() + (week - 1) * 7 * 86400000);
  const targetSunday = new Date(targetMonday.getTime() + 6 * 86400000);

  const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  const startStr = targetMonday.toLocaleDateString('es-ES', options);
  const endStr = targetSunday.toLocaleDateString('es-ES', { ...options, year: 'numeric' });

  return {
    start: targetMonday,
    end: targetSunday,
    label: `${startStr} - ${endStr}`,
  };
}

/**
 * Cambia la semana en un delta (-1 para anterior, +1 para siguiente).
 */
export function shiftWeekKey(weekKey: string, delta: number): string {
  const range = getWeekDateRange(weekKey);
  const newDate = new Date(range.start.getTime() + delta * 7 * 86400000);
  return getWeekKey(newDate);
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
