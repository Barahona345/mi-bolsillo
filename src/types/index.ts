/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Categorías básicas necesarias protegidas (NO recortables)
export const PROTECTED_CATEGORIES: readonly string[] = ['Comida', 'Transporte', 'Útiles'] as const;

export type ProtectedCategory = (typeof PROTECTED_CATEGORIES)[number];

export interface CategoryInfo {
  name: string;
  isProtected: boolean;
  icon: string;
  description: string;
}

export const APP_CATEGORIES: CategoryInfo[] = [
  { name: 'Comida', isProtected: true, icon: 'Utensils', description: 'Almuerzos, viandas y comida diaria (Protegido)' },
  { name: 'Transporte', isProtected: true, icon: 'Bus', description: 'Boleto, colectivo, subte (Protegido)' },
  { name: 'Útiles', isProtected: true, icon: 'BookOpen', description: 'Fotocopias, libros, apuntes (Protegido)' },
  { name: 'Ocio', isProtected: false, icon: 'Gamepad2', description: 'Juegos, salidas, streaming' },
  { name: 'Snacks & Salidas', isProtected: false, icon: 'Coffee', description: 'Golosinas, café al paso, juntadas' },
  { name: 'Otros', isProtected: false, icon: 'Tag', description: 'Gastos varios o imprevistos no esenciales' },
];

export interface Expense {
  id: string;
  amountCents: number; // Monto en centavos enteros (ej: $12.00 = 1200)
  category: string;
  date: string; // ISO 8601 string automática
}

export interface WeekData {
  goalCents: number; // Meta semanal en centavos
  expenses: Expense[];
}

export interface AllWeeksStorage {
  [weekKey: string]: WeekData; // clave tipo "YYYY-MM-DD" del lunes
}

// Estructura fija JSON devuelta por Gemini (responseSchema)
export interface RecorteItem {
  categoria: string;
  gasto_actual_cents: number;
  monto_sugerido_cents: number;
  ahorro_cents: number;
  motivo: string;
}

export interface AIReviewData {
  mensaje_corto: string;
  recortes: RecorteItem[];
  ahorro_total_cents: number;
  disclaimer?: string;
}

export interface AIAnalysisResponse {
  success: boolean;
  data: AIReviewData;
  error?: string;
}
