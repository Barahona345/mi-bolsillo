/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  PROTECTED_CATEGORIES,
  AIAnalysisResponse,
  RecorteItem,
  AIReviewData,
} from '../types';

/**
 * ============================================================================
 * EJEMPLO DE RESPUESTA DE PRUEBA (MOCK) PARA DESARROLLAR SIN GASTAR LLAMADAS
 * ============================================================================
 * Cumple al 100% el esquema responseSchema:
 * - recortes: lista con categoría, gasto actual, monto sugerido, ahorro y motivo
 * - ahorro_total_cents
 * - mensaje_corto
 */
export const SAMPLE_AI_MOCK_RESPONSE: AIReviewData = {
  mensaje_corto: 'Te pasaste por $1.00 de tu meta semanal. Tus gastos en Comida, Transporte y Útiles están a salvo.',
  recortes: [
    {
      categoria: 'Ocio',
      gasto_actual_cents: 500, // $5.00
      monto_sugerido_cents: 100, // $1.00
      ahorro_cents: 400, // $4.00
      motivo: 'Bajar $4.00 de $5.00 espaciando salidas del fin de semana o posponiendo suscripciones.',
    },
  ],
  ahorro_total_cents: 400, // $4.00
  disclaimer: 'Respuesta de prueba (Mock offline para desarrollo sin costo).',
};

export interface AnalyzeWeekParams {
  weeklyGoalCents: number;
  totalSpentCents: number;
  categoryTotals: {
    category: string;
    totalCents: number;
    isProtected: boolean;
  }[];
}

/**
 * Función aislada única para solicitar el análisis de la semana a la IA.
 * Regla de negocio: si no hay gastos, no se llama a la API.
 */
export async function analyzeWeekWithAI(params: AnalyzeWeekParams): Promise<AIAnalysisResponse> {
  const { weeklyGoalCents, totalSpentCents, categoryTotals } = params;

  // --------------------------------------------------------------------------
  // REGLA DE NEGOCIO: Si no hay gastos, no se llama a la IA: se muestra un aviso.
  // --------------------------------------------------------------------------
  const activeCategories = categoryTotals.filter((c) => c.totalCents > 0);
  if (activeCategories.length === 0 || totalSpentCents <= 0) {
    return {
      success: false,
      data: {
        mensaje_corto: 'Aún no registraste gastos esta semana.',
        recortes: [],
        ahorro_total_cents: 0,
      },
      error: 'La semana no tiene gastos registrados para analizar.',
    };
  }

  try {
    // ------------------------------------------------------------------------
    // PRIVACIDAD: Enviamos únicamente los totales por categoría y la meta. Nada más.
    // ------------------------------------------------------------------------
    const payload = {
      weeklyGoalCents,
      totalSpentCents,
      categoryTotals: activeCategories.map((c) => ({
        category: c.category,
        totalCents: c.totalCents,
        isProtected: isCategoryProtected(c.category),
      })),
    };

    const response = await fetch('/api/analyze-expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Error del servidor (${response.status})`);
    }

    const jsonResult = await response.json();
    const serverData: AIReviewData = jsonResult.data || jsonResult;

    // ------------------------------------------------------------------------
    // VALIDACIÓN ESTRICTA EN CÓDIGO (DEFENSA EN PROFUNDIDAD):
    // 1. Regla: Comida, Transporte y Útiles son necesarias -> se descarta cualquier recorte.
    // 2. Regla: Ningún recorte puede ser mayor a lo gastado (ahorro <= gasto_actual).
    // 3. Regla: monto_sugerido = gasto_actual - ahorro.
    // 4. Recalcular ahorro_total_cents.
    // ------------------------------------------------------------------------
    const sanitizedRecortes: RecorteItem[] = [];

    for (const item of serverData.recortes || []) {
      const catName = (item.categoria || '').trim();

      // Regla 1: Descartar si es categoría protegida
      if (isCategoryProtected(catName)) {
        console.warn(`[MI BOLSILLO] Descartado recorte en categoría necesaria: ${catName}`);
        continue;
      }

      // Buscar el gasto real registrado en la categoría
      const realCat = activeCategories.find(
        (c) => c.category.toLowerCase() === catName.toLowerCase()
      );

      if (!realCat || realCat.totalCents <= 0) {
        continue;
      }

      // Regla 2: El recorte jamás puede superar lo gastado
      let safeAhorro = Math.round(Number(item.ahorro_cents) || 0);
      if (safeAhorro > realCat.totalCents) {
        safeAhorro = realCat.totalCents;
      }

      if (safeAhorro <= 0) {
        continue;
      }

      const safeMontoSugerido = realCat.totalCents - safeAhorro;
      const cutDollars = (safeAhorro / 100).toFixed(2);
      const spentDollars = (realCat.totalCents / 100).toFixed(2);

      const motivo =
        item.motivo && item.motivo.length > 5
          ? item.motivo
          : `Bajar $${cutDollars} de $${spentDollars} posponiendo gastos no prioritarios`;

      sanitizedRecortes.push({
        categoria: realCat.category,
        gasto_actual_cents: realCat.totalCents,
        monto_sugerido_cents: safeMontoSugerido,
        ahorro_cents: safeAhorro,
        motivo,
      });
    }

    const ahorroTotal = sanitizedRecortes.reduce((acc, r) => acc + r.ahorro_cents, 0);

    return {
      success: true,
      data: {
        mensaje_corto:
          serverData.mensaje_corto ||
          (totalSpentCents > weeklyGoalCents
            ? `Superaste tu presupuesto semanal. Se proponen recortes en gastos no esenciales.`
            : 'Vas dentro de tu presupuesto semanal.'),
        recortes: sanitizedRecortes,
        ahorro_total_cents: ahorroTotal,
        disclaimer: serverData.disclaimer,
      },
    };
  } catch (error: any) {
    // ------------------------------------------------------------------------
    // MANEJO DE FALLO: Si la IA falla, responde lento o no cumple el esquema,
    // el resto de la app sigue funcionando y mostramos un análisis garantizado.
    // ------------------------------------------------------------------------
    console.warn('[MI BOLSILLO] Servicio en la nube no disponible o timeout:', error?.message);

    const nonProtected = activeCategories.filter((c) => !isCategoryProtected(c.category));
    const fallbackRecortes: RecorteItem[] = [];

    const overBudget = totalSpentCents > weeklyGoalCents;
    const excessCents = Math.max(0, totalSpentCents - weeklyGoalCents);

    for (const cat of nonProtected) {
      const cut = overBudget
        ? Math.min(cat.totalCents, Math.max(100, Math.min(cat.totalCents, excessCents)))
        : Math.round(cat.totalCents * 0.4);

      if (cut > 0) {
        fallbackRecortes.push({
          categoria: cat.category,
          gasto_actual_cents: cat.totalCents,
          monto_sugerido_cents: cat.totalCents - cut,
          ahorro_cents: cut,
          motivo: `Bajar $${(cut / 100).toFixed(2)} de $${(cat.totalCents / 100).toFixed(2)} espaciando salidas`,
        });
      }
    }

    const ahorroTotal = fallbackRecortes.reduce((acc, r) => acc + r.ahorro_cents, 0);

    return {
      success: true,
      data: {
        mensaje_corto: overBudget
          ? `Te pasaste por $${(excessCents / 100).toFixed(2)} de tu meta semanal. Tus gastos en Comida, Transporte y Útiles están a salvo.`
          : 'Vas dentro de tu presupuesto semanal.',
        recortes: fallbackRecortes,
        ahorro_total_cents: ahorroTotal,
        disclaimer: 'Análisis generado con motor local seguro de respaldo.',
      },
    };
  }
}

export function isCategoryProtected(categoryName: string): boolean {
  if (!categoryName) return false;
  const normalized = categoryName.trim().toLowerCase();
  return PROTECTED_CATEGORIES.some((p) => p.toLowerCase() === normalized);
}
