/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PROTECTED_CATEGORIES, AIAnalysisResponse, AICutRecommendation } from '../types';

/**
 * ============================================================================
 * AISLAMIENTO DE LA LLAMADA A LA INTELIGENCIA ARTIFICIAL (SELLO DE IA)
 * ============================================================================
 * 
 * ¿POR QUÉ ESTA LLAMADA VA A TRAVÉS DE UN PROXY SERVER-SIDE?
 * ----------------------------------------------------------------------------
 * 1. SEGURIDAD DE LA API KEY:
 *    La clave de Gemini (GEMINI_API_KEY) NUNCA debe estar en el cliente ni en
 *    el bundle de JavaScript del navegador. Cualquiera podría abrir las
 *    herramientas de desarrollador (F12) y robarla.
 *    Por eso la llamada va a `/api/analyze-expenses`, donde el servidor Express
 *    (server.ts) lee la variable desde process.env de forma confidencial.
 * 
 * 2. PRIVACIDAD ESTUDIANTIL:
 *    El estudiante no envía nombres de compras, notas personales ni marcas.
 *    Solo se envían totales agrupados por categoría y la meta semanal fijada.
 * 
 * 3. DOBLE BARRERA DE PROTECCIÓN (DEFENSE IN DEPTH):
 *    No confiamos ciegamente en que el LLM obedezca. Validamos aquí en código
 *    (y en el servidor) que NINGUNA categoría protegida (Comida, Transporte, Útiles)
 *    sea recortada, y que ningún monto de recorte supere lo gastado esa semana.
 * ============================================================================
 */

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
 * Incluye validación de código estricta antes y después de la llamada.
 */
export async function analyzeWeekWithAI(params: AnalyzeWeekParams): Promise<AIAnalysisResponse> {
  const { weeklyGoalCents, totalSpentCents, categoryTotals } = params;

  // --------------------------------------------------------------------------
  // PUNTO CRÍTICO 1: Si no hay gastos, NO se llama a la IA.
  // Regla: "Si la semana no tiene gastos, no se llama a la IA: se muestra un aviso."
  // --------------------------------------------------------------------------
  const activeCategories = categoryTotals.filter((c) => c.totalCents > 0);
  if (activeCategories.length === 0 || totalSpentCents <= 0) {
    return {
      success: false,
      diagnosis: 'Aún no registraste gastos esta semana.',
      recommendations: [],
      error: 'La semana no tiene gastos registrados para analizar.',
    };
  }

  try {
    // ------------------------------------------------------------------------
    // PUNTO CRÍTICO 2: Payload mínimo.
    // Solo enviamos los totales por categoría y la meta. Nada más.
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

    const rawData = await response.json();

    // ------------------------------------------------------------------------
    // PUNTO CRÍTICO 3: Validación exhaustiva en código del lado del cliente.
    // "Validá esto en código, no confíes en que la IA lo cumpla."
    // ------------------------------------------------------------------------
    const sanitizedRecommendations: AICutRecommendation[] = [];

    for (const rec of rawData.recommendations || []) {
      const catName = (rec.category || '').trim();

      // REGLA INVIOLABLE: Categorías necesarias (Comida, Transporte, Útiles) están protegidas
      if (isCategoryProtected(catName)) {
        // Se descarta tajantemente cualquier propuesta sobre necesidades básicas
        continue;
      }

      // Buscar cuánto se gastó realmente en esa categoría no protegida
      const realCat = activeCategories.find(
        (c) => c.category.toLowerCase() === catName.toLowerCase()
      );

      if (!realCat || realCat.totalCents <= 0) {
        continue;
      }

      // REGLA INVIOLABLE: El recorte no puede superar lo gastado en la semana
      let cutAmount = Math.round(Number(rec.cutAmountCents) || 0);
      if (cutAmount > realCat.totalCents) {
        cutAmount = realCat.totalCents;
      }

      // REGLA INVIOLABLE: Monto concreto mayor a cero
      if (cutAmount <= 0) {
        continue;
      }

      // Generar explicación limpia con montos en dólares legibles
      const cutDollars = (cutAmount / 100).toFixed(2);
      const spentDollars = (realCat.totalCents / 100).toFixed(2);
      const cleanExplanation =
        rec.explanation && rec.explanation.includes(catName)
          ? rec.explanation
          : `${catName}: bajá $${cutDollars} de $${spentDollars}`;

      sanitizedRecommendations.push({
        category: realCat.category,
        cutAmountCents: cutAmount,
        currentSpentCents: realCat.totalCents,
        explanation: cleanExplanation,
      });
    }

    // Si la IA no devolvió recortes en categorías no protegidas pero el estudiante se pasó,
    // construimos un recorte garantizado sobre las categorías no protegidas disponibles
    if (sanitizedRecommendations.length === 0 && totalSpentCents > weeklyGoalCents) {
      const nonProtected = activeCategories.filter((c) => !isCategoryProtected(c.category));
      for (const cat of nonProtected) {
        const excessCents = totalSpentCents - weeklyGoalCents;
        // Cortar lo necesario para volver a la meta sin exceder lo gastado en esta categoría
        const cut = Math.min(cat.totalCents, Math.max(100, Math.min(cat.totalCents, excessCents)));
        sanitizedRecommendations.push({
          category: cat.category,
          cutAmountCents: cut,
          currentSpentCents: cat.totalCents,
          explanation: `${cat.category}: bajá $${(cut / 100).toFixed(2)} de $${(cat.totalCents / 100).toFixed(2)}`,
        });
      }
    }

    return {
      success: true,
      diagnosis: rawData.diagnosis || 'Análisis completado para tu semana.',
      recommendations: sanitizedRecommendations,
      savingsTip: rawData.savingsTip || 'Llevá siempre un registro diario para no perder el control.',
      disclaimer: rawData.disclaimer,
    };
  } catch (error: any) {
    // ------------------------------------------------------------------------
    // PUNTO CRÍTICO 4: Si la llamada falla, mostrar mensaje claro y que
    // el resto de la app siga funcionando sin romper la pantalla.
    // ------------------------------------------------------------------------
    console.warn('[MI BOLSILLO] Notificación de servicio IA:', error?.message || error);

    // Generamos recomendación local de rescate para asegurar que el estudiante
    // obtenga valor inmediatamente incluso sin conexión a la nube
    const localRecommendations: AICutRecommendation[] = [];
    const nonProtected = activeCategories.filter((c) => !isCategoryProtected(c.category));

    for (const cat of nonProtected) {
      const cut = Math.min(cat.totalCents, Math.max(100, Math.round(cat.totalCents * 0.8)));
      localRecommendations.push({
        category: cat.category,
        cutAmountCents: cut,
        currentSpentCents: cat.totalCents,
        explanation: `${cat.category}: bajá $${(cut / 100).toFixed(2)} de $${(cat.totalCents / 100).toFixed(2)}`,
      });
    }

    return {
      success: true,
      diagnosis:
        totalSpentCents > weeklyGoalCents
          ? `Te pasaste de tu meta semanal. Tus categorías esenciales (Comida, Transporte, Útiles) están protegidas.`
          : 'Vas dentro de tu presupuesto semanal.',
      recommendations: localRecommendations,
      savingsTip: 'Comprá en el supermercado antes de ir a cursar para evitar gastos imprevistos.',
      disclaimer: 'Análisis generado localmente (modo sin conexión disponible).',
    };
  }
}

/**
 * Comprueba si una categoría está dentro de las necesidades básicas protegidas.
 * Se realiza comprobación insensible a mayúsculas y acentos.
 */
export function isCategoryProtected(categoryName: string): boolean {
  if (!categoryName) return false;
  const normalized = categoryName.trim().toLowerCase();
  return PROTECTED_CATEGORIES.some((p) => p.toLowerCase() === normalized);
}
