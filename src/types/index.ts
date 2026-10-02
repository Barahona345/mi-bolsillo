/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Categorías protegidas que cubren lo básico del estudiante
export const PROTECTED_CATEGORIES: readonly string[] = ['Comida', 'Transporte', 'Útiles'] as const;

export type ProtectedCategory = (typeof PROTECTED_CATEGORIES)[number];

export interface CategoryInfo {
  name: string;
  isProtected: boolean;
  icon: string;
  description: string;
}

export const APP_CATEGORIES: CategoryInfo[] = [
  { name: 'Comida', isProtected: true, icon: 'Utensils', description: 'Almuerzos, merienda diaria (Protegido)' },
  { name: 'Transporte', isProtected: true, icon: 'Bus', description: 'Boleto, subte, colectivo (Protegido)' },
  { name: 'Útiles', isProtected: true, icon: 'BookOpen', description: 'Fotocopias, cuadernos, librería (Protegido)' },
  { name: 'Ocio', isProtected: false, icon: 'Gamepad2', description: 'Juegos, salidas, streaming' },
  { name: 'Snacks & Salidas', isProtected: false, icon: 'Coffee', description: 'Golosinas, café al paso, juntadas' },
  { name: 'Otros', isProtected: false, icon: 'Tag', description: 'Gastos varios o imprevistos no esenciales' },
];

export interface Expense {
  id: string;
  amountCents: number; // Monto en centavos (ej: $12.00 = 1200)
  category: string;
  date: string; // ISO 8601 string, se guarda automáticamente
}

export interface WeekData {
  goalCents: number; // Meta semanal en centavos
  expenses: Expense[];
}

export interface AllWeeksStorage {
  [weekKey: string]: WeekData; // clave tipo "2026-W40"
}

export interface CategorySummary {
  category: string;
  totalCents: number;
  isProtected: boolean;
  expenseCount: number;
}

export interface AIAnalysisRequest {
  weekKey: string;
  weeklyGoalCents: number;
  totalSpentCents: number;
  categories: {
    category: string;
    totalCents: number;
    isProtected: boolean;
  }[];
}

export interface AICutRecommendation {
  category: string;
  cutAmountCents: number; // Monto concreto en centavos (<= total gastado en la categoría)
  currentSpentCents: number;
  explanation: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  diagnosis: string;
  recommendations: AICutRecommendation[];
  savingsTip?: string;
  disclaimer?: string;
  error?: string;
}
