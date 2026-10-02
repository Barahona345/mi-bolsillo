/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// ============================================================================
// PROXY DE SEGURIDAD PARA GEMINI API:
// La clave GEMINI_API_KEY NUNCA debe viajar ni exponerse en el frontend.
// Se inicializa en el servidor usando las variables de entorno de forma segura.
// ============================================================================
const apiKey = process.env.GEMINI_API_KEY;

// Cliente de Gemini usando el SDK oficial @google/genai
const ai = new GoogleGenAI({
  apiKey: apiKey || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Categorías necesarias protegidas que la IA NUNCA debe recortar
const PROTECTED_CATEGORIES = ['Comida', 'Transporte', 'Útiles'];

interface AnalyzeRequestBody {
  weeklyGoalCents: number;
  totalSpentCents: number;
  categoryTotals: {
    category: string;
    totalCents: number;
    isProtected: boolean;
  }[];
}

/**
 * Endpoint de análisis de gastos semanales para el estudiante.
 * Regla de privacidad: La IA recibe únicamente los totales por categoría y la meta semanal.
 */
app.post('/api/analyze-expenses', async (req: Request<{}, {}, AnalyzeRequestBody>, res: Response) => {
  const { weeklyGoalCents, totalSpentCents, categoryTotals } = req.body;

  // Validación básica de entrada
  if (!categoryTotals || !Array.isArray(categoryTotals) || categoryTotals.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'No hay gastos para analizar en esta semana.',
    });
  }

  // Filtrar categorías que tengan gasto > 0
  const activeCategories = categoryTotals.filter((c) => c.totalCents > 0);
  if (activeCategories.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'La semana no tiene gastos registrados.',
    });
  }

  // Preparar resumen para el prompt
  const overBudget = totalSpentCents > weeklyGoalCents;
  const differenceCents = Math.abs(totalSpentCents - weeklyGoalCents);

  const categoriesText = activeCategories
    .map((c) => {
      const isProtected = PROTECTED_CATEGORIES.some(
        (p) => p.toLowerCase() === c.category.trim().toLowerCase()
      );
      return `- ${c.category}: $${(c.totalCents / 100).toFixed(2)} (${isProtected ? 'CATEGORÍA NECESARIA/PROTEGIDA' : 'Categoría recortable/no esencial'})`;
    })
    .join('\n');

  // Si no hay API key disponible en el entorno, usamos el generador de recorte algorítmico seguro
  if (!apiKey) {
    console.warn('[MI BOLSILLO] GEMINI_API_KEY no detectada. Usando motor de respaldo con reglas financieras.');
    const fallbackResponse = generateLocalCutRecommendations(weeklyGoalCents, totalSpentCents, activeCategories);
    return res.json(fallbackResponse);
  }

  try {
    const prompt = `Actúas como el mentor financiero de "MI BOLSILLO" para un estudiante con presupuesto ajustado.
Analiza la situación semanal y propón recortes realistas.

DATOS DE LA SEMANA:
- Meta semanal: $${(weeklyGoalCents / 100).toFixed(2)}
- Total gastado: $${(totalSpentCents / 100).toFixed(2)}
- Estado: ${overBudget ? `Se pasó por $${(differenceCents / 100).toFixed(2)}` : `Dentro del presupuesto, le sobran $${(differenceCents / 100).toFixed(2)}`}

TOTALES POR CATEGORÍA:
${categoriesText}

REGLAS ESTRICTAS E INVIOLABLES:
1. CATEGORÍAS PROTEGIDAS: Las categorías "Comida", "Transporte" y "Útiles" son gastos de supervivencia estudiantil. NUNCA propongas recortes en estas tres categorías. Cero recortes en Comida, Transporte ni Útiles.
2. MONTO CONCRETO: Cada recorte propuesto en categorías no protegidas (como Ocio, Snacks & Salidas, Otros) debe ser un monto concreto en centavos (ejemplo: si gastó $5.00 en Ocio, puedes proponer recortar 400 centavos = $4.00, con la explicación "Ocio: bajá $4 de $5").
3. LÍMITE: El recorte jamás puede ser mayor al total gastado en esa categoría esa semana.
4. FORMATO: Devuelve una respuesta JSON estructurada con el diagnóstico, las recomendaciones de recorte y un tip de ahorro.`;

    // Intentar consulta a Gemini con límite de tiempo para garantizar fluidez
    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Eres un asesor financiero empático para estudiantes universitarios y secundarios. Hablas en español claro y conciso. Proteges siempre la comida, el transporte y los útiles. Solo sugieres recortes con montos concretos en categorías no esenciales (como Ocio, Snacks, Salidas).',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mensaje_corto: {
              type: Type.STRING,
              description: 'Diagnóstico o mensaje corto de la semana en 1 o 2 oraciones.',
            },
            recortes: {
              type: Type.ARRAY,
              description: 'Lista de propuestas de recorte en categorías no protegidas',
              items: {
                type: Type.OBJECT,
                properties: {
                  categoria: {
                    type: Type.STRING,
                    description: 'Nombre de la categoría no protegida (ej: Ocio)',
                  },
                  gasto_actual_cents: {
                    type: Type.INTEGER,
                    description: 'Gasto actual en la categoría en centavos',
                  },
                  monto_sugerido_cents: {
                    type: Type.INTEGER,
                    description: 'Monto propuesto tras el recorte en centavos',
                  },
                  ahorro_cents: {
                    type: Type.INTEGER,
                    description: 'Monto concreto que se ahorra en centavos',
                  },
                  motivo: {
                    type: Type.STRING,
                    description: 'Motivo concreto de la sugerencia',
                  },
                },
                required: ['categoria', 'gasto_actual_cents', 'monto_sugerido_cents', 'ahorro_cents', 'motivo'],
              },
            },
            ahorro_total_cents: {
              type: Type.INTEGER,
              description: 'Suma de todos los ahorros en centavos',
            },
          },
          required: ['mensaje_corto', 'recortes', 'ahorro_total_cents'],
        },
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Tiempo de espera agotado al consultar a Gemini')), 7000)
    );

    const aiResponse = await Promise.race([aiPromise, timeoutPromise]);

    const responseText = aiResponse.text;
    if (!responseText) {
      throw new Error('Respuesta vacía del modelo Gemini');
    }

    const parsedData = JSON.parse(responseText);

    // ========================================================================
    // VALIDACIÓN ESTRICTA EN CÓDIGO (No confiar en que la IA lo cumpla):
    // 1. Eliminar cualquier recomendación en categorías protegidas
    // 2. Limitar el recorte al monto real gastado en la categoría
    // 3. Descartar montos <= 0
    // ========================================================================
    const validatedRecortes = [];

    for (const rec of parsedData.recortes || []) {
      const catName = (rec.categoria || '').trim();
      const isProtected = PROTECTED_CATEGORIES.some(
        (p) => p.toLowerCase() === catName.toLowerCase()
      );

      // Regla 1: Descartar si es categoría protegida (Comida, Transporte, Útiles)
      if (isProtected) {
        console.warn(`[MI BOLSILLO VALIDACIÓN] Se descartó sugerencia de IA en categoría protegida: ${catName}`);
        continue;
      }

      // Buscar el total real gastado en esta categoría
      const realCategory = activeCategories.find(
        (c) => c.category.toLowerCase() === catName.toLowerCase()
      );

      if (!realCategory || realCategory.totalCents <= 0) {
        continue;
      }

      // Regla 2: El recorte no puede superar lo gastado (ahorro <= gasto_actual)
      let safeAhorroCents = Math.round(Number(rec.ahorro_cents) || 0);
      if (safeAhorroCents > realCategory.totalCents) {
        safeAhorroCents = realCategory.totalCents;
      }

      // Descartar si el ahorro es <= 0
      if (safeAhorroCents <= 0) {
        continue;
      }

      const safeMontoSugerido = realCategory.totalCents - safeAhorroCents;
      const cutDollars = (safeAhorroCents / 100).toFixed(2);
      const spentDollars = (realCategory.totalCents / 100).toFixed(2);

      const motivo =
        rec.motivo && rec.motivo.length > 5
          ? rec.motivo
          : `Bajar $${cutDollars} de $${spentDollars} postergando compras no prioritarias`;

      validatedRecortes.push({
        categoria: realCategory.category,
        gasto_actual_cents: realCategory.totalCents,
        monto_sugerido_cents: safeMontoSugerido,
        ahorro_cents: safeAhorroCents,
        motivo,
      });
    }

    // Si la IA no encontró recortes válidos pero hay exceso de presupuesto,
    // garantizamos una propuesta en categorías no esenciales (ej. Ocio)
    if (validatedRecortes.length === 0 && overBudget) {
      const fallback = generateLocalCutRecommendations(weeklyGoalCents, totalSpentCents, activeCategories);
      return res.json({
        success: true,
        data: fallback.data,
      });
    }

    const ahorroTotal = validatedRecortes.reduce((acc, r) => acc + r.ahorro_cents, 0);

    return res.json({
      success: true,
      data: {
        mensaje_corto:
          parsedData.mensaje_corto ||
          (overBudget
            ? `Te pasaste por $${(differenceCents / 100).toFixed(2)} de tu meta.`
            : '¡Vas dentro de tu presupuesto!'),
        recortes: validatedRecortes,
        ahorro_total_cents: ahorroTotal,
      },
    });
  } catch (error: any) {
    console.error('[MI BOLSILLO] Error al llamar a Gemini API:', error?.message || error);
    // En caso de fallo de la API o timeout, devolver un análisis garantizado con reglas de código
    const fallback = generateLocalCutRecommendations(weeklyGoalCents, totalSpentCents, activeCategories);
    return res.json({
      success: true,
      data: {
        ...fallback.data,
        disclaimer: 'Análisis generado con motor local seguro de respaldo.',
      },
    });
  }
});

/**
 * Generador algorítmico seguro de recortes (usado como respaldo o validación).
 * Protege Comida, Transporte y Útiles, y propone recortes concretos en Ocio y no esenciales.
 */
function generateLocalCutRecommendations(
  weeklyGoalCents: number,
  totalSpentCents: number,
  categories: { category: string; totalCents: number; isProtected: boolean }[]
) {
  const overBudget = totalSpentCents > weeklyGoalCents;
  const excessCents = Math.max(0, totalSpentCents - weeklyGoalCents);

  // Filtrar únicamente categorías NO protegidas con gasto
  const nonProtected = categories.filter((c) => {
    return !PROTECTED_CATEGORIES.some((p) => p.toLowerCase() === c.category.toLowerCase()) && c.totalCents > 0;
  });

  const recortes = [];

  for (const cat of nonProtected) {
    let cutCents: number;
    if (overBudget) {
      const maxPossibleCut = Math.min(cat.totalCents, Math.max(excessCents, Math.round(cat.totalCents * 0.8)));
      cutCents = Math.max(100, Math.min(cat.totalCents, maxPossibleCut));
    } else {
      cutCents = Math.round(cat.totalCents * 0.4);
    }

    if (cutCents > 0) {
      const cutDollars = (cutCents / 100).toFixed(2);
      const spentDollars = (cat.totalCents / 100).toFixed(2);
      recortes.push({
        categoria: cat.category,
        gasto_actual_cents: cat.totalCents,
        monto_sugerido_cents: cat.totalCents - cutCents,
        ahorro_cents: cutCents,
        motivo: `Bajar $${cutDollars} de $${spentDollars} postergando compras no prioritarias`,
      });
    }
  }

  const ahorroTotal = recortes.reduce((acc, r) => acc + r.ahorro_cents, 0);

  const mensaje_corto = overBudget
    ? `Te pasaste por $${(excessCents / 100).toFixed(2)} de tu meta semanal. Tus gastos en Comida, Transporte y Útiles están a salvo.`
    : `Vas dentro de tu presupuesto semanal. Mantén protegidos tus gastos básicos.`;

  return {
    success: true,
    data: {
      mensaje_corto,
      recortes,
      ahorro_total_cents: ahorroTotal,
    },
  };
}

// ============================================================================
// INICIALIZACIÓN DEL SERVIDOR Y MONTAJE DE VITE
// ============================================================================
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Modo Desarrollo: montar middleware de Vite
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Modo Producción: servir estáticos compilados
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[MI BOLSILLO] Servidor escuchando en http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Error al iniciar el servidor:', err);
});
