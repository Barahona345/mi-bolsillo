/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { WeekData, AIAnalysisResponse } from './types';
import { getWeekKey, getWeekDateRange, shiftWeekKey } from './utils/dateUtils';
import {
  getWeekData,
  saveWeeklyGoal,
  addExpense,
  removeExpense,
} from './services/storageService';
import { analyzeWeekWithAI, isCategoryProtected } from './services/aiService';
import { SemaforoCard } from './components/SemaforoCard';
import { GoalModal } from './components/GoalModal';
import { ExpenseForm } from './components/ExpenseForm';
import { ExpenseList } from './components/ExpenseList';
import { AIReviewModal } from './components/AIReviewModal';
import {
  Wallet,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertCircle,
} from 'lucide-react';

export default function App() {
  // Clave de semana actual calculada en hora local (ej: "2026-W40")
  const currentRealWeek = useMemo(() => getWeekKey(new Date()), []);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(currentRealWeek);

  // Datos de la semana seleccionada
  const [weekData, setWeekData] = useState<WeekData>(() => getWeekData(currentRealWeek));

  // Estados de modales
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // Mensaje flotante de aviso (por ejemplo si no hay gastos para la IA)
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Recargar datos cuando cambia la semana seleccionada
  useEffect(() => {
    const data = getWeekData(selectedWeekKey);
    setWeekData(data);
  }, [selectedWeekKey]);

  // Información de fechas de la semana seleccionada
  const weekInfo = useMemo(() => getWeekDateRange(selectedWeekKey), [selectedWeekKey]);
  const isCurrentWeek = selectedWeekKey === currentRealWeek;

  // Total gastado en la semana (en centavos)
  const totalSpentCents = useMemo(() => {
    return weekData.expenses.reduce((acc, exp) => acc + exp.amountCents, 0);
  }, [weekData.expenses]);

  // Manejo de guardar la meta semanal
  const handleSaveGoal = (cents: number) => {
    const updated = saveWeeklyGoal(selectedWeekKey, cents);
    setWeekData(updated);
  };

  // Manejo de registrar gasto
  const handleAddExpense = (amountCents: number, category: string) => {
    const { weekData: updated } = addExpense(selectedWeekKey, amountCents, category);
    setWeekData(updated);
  };

  // Manejo de eliminar gasto
  const handleDeleteExpense = (id: string) => {
    const updated = removeExpense(selectedWeekKey, id);
    setWeekData(updated);
  };

  // Botón "Revisar mi semana" (Sello de IA)
  const handleReviewWeekClick = async () => {
    // REGLA ESTRICTA DE LA IA:
    // "Si la semana no tiene gastos, no se llama a la IA: se muestra un aviso."
    if (weekData.expenses.length === 0 || totalSpentCents <= 0) {
      setToastNotice('Aún no registraste gastos esta semana. Anotá al menos un gasto para que la IA pueda analizarlo.');
      setTimeout(() => setToastNotice(null), 4000);
      return;
    }

    // Si no fijó meta, sugerir fijar una meta antes o usar meta predeterminada
    const effectiveGoalCents = weekData.goalCents > 0 ? weekData.goalCents : 2000;

    // Abrir modal y disparar análisis
    setIsAIModalOpen(true);
    setIsAILoading(true);
    setAiErrorMessage(null);
    setAiAnalysis(null);

    // Calcular totales agrupados por categoría (la IA solo recibe totales y la meta)
    const categoryTotalsMap = weekData.expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amountCents;
      return acc;
    }, {} as Record<string, number>);

    const categoryTotals = Object.entries(categoryTotalsMap).map(([category, totalCents]) => ({
      category,
      totalCents,
      isProtected: isCategoryProtected(category),
    }));

    try {
      const result = await analyzeWeekWithAI({
        weeklyGoalCents: effectiveGoalCents,
        totalSpentCents,
        categoryTotals,
      });

      if (result.success) {
        setAiAnalysis(result);
      } else {
        setAiErrorMessage(result.error || 'No se pudo completar el análisis.');
      }
    } catch (err: any) {
      setAiErrorMessage('Hubo un problema al consultar al mentor IA. Probá nuevamente en unos instantes.');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Contenedor principal con diseño optimizado para móvil (max-w-md centrado) */}
      <div className="w-full max-w-md mx-auto min-h-screen flex flex-col bg-slate-50 border-x border-slate-200/80 shadow-xl pb-24">
        
        {/* Cabecera de la App */}
        <header className="bg-white px-5 pt-6 pb-4 border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-emerald-200">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight leading-none">
                  MI BOLSILLO
                </h1>
                <p className="text-[11px] font-semibold text-emerald-700 tracking-wide mt-0.5">
                  Finanzas del estudiante
                </p>
              </div>
            </div>

            {/* Sello de IA: Botón siempre visible en la cabecera */}
            <button
              onClick={handleReviewWeekClick}
              className="py-2 px-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold rounded-2xl text-xs transition-all shadow-md shadow-indigo-200 flex items-center gap-1.5 cursor-pointer"
              title="Analizar gastos de la semana con IA"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Revisar mi semana</span>
            </button>
          </div>

          {/* Navegador de Semanas (Lunes a Domingo, clave tipo "2026-W40") */}
          <div className="flex items-center justify-between bg-slate-100/90 rounded-2xl p-1.5">
            <button
              onClick={() => setSelectedWeekKey(shiftWeekKey(selectedWeekKey, -1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all"
              aria-label="Semana anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center flex-1 px-2">
              <div className="flex items-center justify-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-xs font-black text-slate-800 tracking-tight">
                  {selectedWeekKey}
                </span>
                {isCurrentWeek && (
                  <span className="text-[10px] bg-emerald-600 text-white font-bold px-1.5 py-0.2 rounded-md">
                    Actual
                  </span>
                )}
              </div>
              <span className="text-[11px] font-medium text-slate-500 block">
                {weekInfo.label}
              </span>
            </div>

            <button
              onClick={() => setSelectedWeekKey(shiftWeekKey(selectedWeekKey, 1))}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-xl transition-all"
              aria-label="Semana siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Notificación Toast flotante si aplica */}
        {toastNotice && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{toastNotice}</span>
          </div>
        )}

        {/* Cuerpo principal con las 3 funciones base + Sello de IA */}
        <main className="p-4 space-y-4 flex-1">
          {/* FUNCIÓN 3 & 2: Semáforo inteligente + Meta semanal */}
          <section aria-label="Semáforo de gastos">
            <SemaforoCard
              goalCents={weekData.goalCents}
              spentCents={totalSpentCents}
              onEditGoalClick={() => setIsGoalModalOpen(true)}
            />
          </section>

          {/* Banner directo para "Revisar mi semana" (Sello de IA) */}
          <section className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 text-white rounded-3xl p-4 shadow-md relative overflow-hidden">
            <div className="relative z-10 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] uppercase tracking-wider font-extrabold bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded-full">
                    Sello de IA
                  </span>
                  <span className="text-[10px] text-emerald-300 font-bold">
                    🛡️ Comida y transporte protegidos
                  </span>
                </div>
                <h2 className="text-base font-black tracking-tight leading-tight">
                  ¿A dónde se fue la plata?
                </h2>
                <p className="text-xs text-indigo-200/90 mt-0.5">
                  La IA analiza tus gastos y te dice dónde recortar con montos exactos.
                </p>
              </div>

              <button
                onClick={handleReviewWeekClick}
                className="py-3 px-4 bg-white text-indigo-950 hover:bg-indigo-50 active:scale-95 font-black text-xs rounded-2xl shrink-0 transition-all shadow-md cursor-pointer flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Revisar mi semana</span>
              </button>
            </div>
          </section>

          {/* FUNCIÓN 1: Registrar un gasto con monto y categoría */}
          <section aria-label="Registrar gasto">
            <ExpenseForm onAddExpense={handleAddExpense} />
          </section>

          {/* Listado de movimientos de la semana */}
          <section aria-label="Lista de gastos">
            <ExpenseList
              expenses={weekData.expenses}
              onDeleteExpense={handleDeleteExpense}
            />
          </section>
        </main>

        {/* Modal de fijar meta semanal */}
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          currentGoalCents={weekData.goalCents}
          onSaveGoal={handleSaveGoal}
          weekLabel={weekInfo.label}
        />

        {/* Modal del Sello de IA "Revisar mi semana" */}
        <AIReviewModal
          isOpen={isAIModalOpen}
          onClose={() => setIsAIModalOpen(false)}
          isLoading={isAILoading}
          analysis={aiAnalysis}
          errorMessage={aiErrorMessage}
          totalSpentCents={totalSpentCents}
          goalCents={weekData.goalCents}
        />
      </div>
    </div>
  );
}
