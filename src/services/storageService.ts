/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeekData, Expense, AllWeeksStorage } from '../types';

const STORAGE_KEY = 'mi_bolsillo_data_v1';

/**
 * Obtiene todos los datos almacenados en localStorage.
 * Maneja posibles fallos de serialización silenciosamente.
 */
export function getAllStoredData(): AllWeeksStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer de localStorage:', err);
    return {};
  }
}

/**
 * Guarda el mapa completo de semanas en localStorage.
 */
function persistAllData(data: AllWeeksStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error al guardar en localStorage:', err);
  }
}

/**
 * Obtiene los datos de una semana específica (clave tipo "2026-W40").
 * Si no existe aún, devuelve una estructura limpia inicial.
 */
export function getWeekData(weekKey: string): WeekData {
  const all = getAllStoredData();
  if (all[weekKey]) {
    return all[weekKey];
  }
  return {
    goalCents: 0,
    expenses: [],
  };
}

/**
 * Actualiza la meta semanal de gasto en centavos para la semana indicada.
 */
export function saveWeeklyGoal(weekKey: string, goalCents: number): WeekData {
  const all = getAllStoredData();
  const current = all[weekKey] || { goalCents: 0, expenses: [] };

  const updated: WeekData = {
    ...current,
    goalCents: Math.max(0, Math.round(goalCents)),
  };

  all[weekKey] = updated;
  persistAllData(all);
  return updated;
}

/**
 * Registra un nuevo gasto con monto (en centavos, entero) y categoría.
 * La fecha se guarda sola en hora local / ISO.
 */
export function addExpense(weekKey: string, amountCents: number, category: string): { expense: Expense; weekData: WeekData } {
  const all = getAllStoredData();
  const current = all[weekKey] || { goalCents: 0, expenses: [] };

  const newExpense: Expense = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amountCents: Math.max(1, Math.round(amountCents)), // Siempre entero positivo
    category: category.trim(),
    date: new Date().toISOString(), // La fecha se guarda automáticamente
  };

  // Guardar al inicio de la lista (más recientes primero)
  const updatedExpenses = [newExpense, ...current.expenses];

  const updatedWeek: WeekData = {
    ...current,
    expenses: updatedExpenses,
  };

  all[weekKey] = updatedWeek;
  persistAllData(all);

  return { expense: newExpense, weekData: updatedWeek };
}

/**
 * Elimina un gasto puntual de la semana.
 */
export function removeExpense(weekKey: string, expenseId: string): WeekData {
  const all = getAllStoredData();
  const current = all[weekKey] || { goalCents: 0, expenses: [] };

  const updatedWeek: WeekData = {
    ...current,
    expenses: current.expenses.filter((e) => e.id !== expenseId),
  };

  all[weekKey] = updatedWeek;
  persistAllData(all);
  return updatedWeek;
}
