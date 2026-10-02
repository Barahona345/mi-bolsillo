/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { WeekData, Expense, AllWeeksStorage } from '../types';
import { getWeekKey } from '../utils/dateUtils';

export const STORAGE_KEY = 'mi_bolsillo_data_v1';

/**
 * ============================================================================
 * DATO DE EJEMPLO PRE-CARGADO PARA PRUEBAS
 * ============================================================================
 * Semana con clave del lunes en formato "YYYY-MM-DD":
 * - Meta semanal: 2000 centavos ($20.00)
 * - Gastos:
 *   * 1200 centavos ($12.00) en Comida
 *   * 500 centavos ($5.00) en Ocio
 *   * 400 centavos ($4.00) en Transporte
 * Total gastado: 2100 centavos ($21.00) -> Se pasa por $1.00 (Semáforo Rojo).
 */
export const SAMPLE_INITIAL_DATA: AllWeeksStorage = {
  [getWeekKey(new Date())]: {
    goalCents: 2000, // $20.00
    expenses: [
      {
        id: 'sample_exp_1',
        amountCents: 1200, // $12.00
        category: 'Comida',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sample_exp_2',
        amountCents: 500, // $5.00
        category: 'Ocio',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: 'sample_exp_3',
        amountCents: 400, // $4.00
        category: 'Transporte',
        date: new Date().toISOString(),
      },
    ],
  },
};

/**
 * ============================================================================
 * 1. LEER (READ): Obtener todos los datos de localStorage
 * ============================================================================
 */
export function getAllStoredData(): AllWeeksStorage {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Si el almacenamiento está vacío, inicializamos con los datos de ejemplo
      persistAllData(SAMPLE_INITIAL_DATA);
      return SAMPLE_INITIAL_DATA;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error al leer de localStorage:', err);
    return SAMPLE_INITIAL_DATA;
  }
}

/**
 * Obtener los datos de una semana específica (clave del lunes en formato "YYYY-MM-DD").
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
 * ============================================================================
 * 2. GUARDAR (WRITE / PERSIST): Guardar en localStorage
 * ============================================================================
 */
function persistAllData(data: AllWeeksStorage): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Error al persistir en localStorage:', err);
  }
}

/**
 * Guarda o actualiza la meta semanal de gasto en centavos para una semana.
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
 * Registra un nuevo gasto con monto (centavos entero), categoría y fecha automática.
 */
export function addExpense(
  weekKey: string,
  amountCents: number,
  category: string
): { expense: Expense; weekData: WeekData } {
  const all = getAllStoredData();
  const current = all[weekKey] || { goalCents: 0, expenses: [] };

  const newExpense: Expense = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    amountCents: Math.max(1, Math.round(amountCents)),
    category: category.trim(),
    date: new Date().toISOString(), // Fecha automática
  };

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
 * ============================================================================
 * 3. BORRAR (DELETE): Eliminar un gasto puntual o resetear semana/almacenamiento
 * ============================================================================
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

/**
 * Borra todos los gastos de una semana específica manteniendo la meta.
 */
export function clearWeekExpenses(weekKey: string): WeekData {
  const all = getAllStoredData();
  const current = all[weekKey] || { goalCents: 0, expenses: [] };

  const updatedWeek: WeekData = {
    ...current,
    expenses: [],
  };

  all[weekKey] = updatedWeek;
  persistAllData(all);
  return updatedWeek;
}

/**
 * Borra por completo los datos de la app de localStorage.
 */
export function clearAllStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error al limpiar localStorage:', err);
  }
}

/**
 * ============================================================================
 * 4. EXPORTAR A ARCHIVO JSON (BACKUP / RESPALDO)
 * ============================================================================
 * Genera un archivo .json descargable directamente en el navegador del usuario.
 */
export function exportDataAsJSONFile(): void {
  try {
    const data = getAllStoredData();
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const todayStr = new Date().toISOString().split('T')[0];
    const link = document.createElement('a');
    link.href = url;
    link.download = `mi_bolsillo_respaldo_${todayStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error al exportar respaldo:', err);
  }
}

/**
 * Importa datos desde un archivo JSON de respaldo.
 */
export function importDataFromJSON(jsonString: string): boolean {
  try {
    const parsed = JSON.parse(jsonString);
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('Formato JSON inválido');
    }
    persistAllData(parsed);
    return true;
  } catch (err) {
    console.error('Error al importar archivo de respaldo:', err);
    return false;
  }
}
