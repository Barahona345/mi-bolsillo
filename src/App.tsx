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
  exportDataAsJSONFile,
  clearWeekExpenses,
  SAMPLE_INITIAL_DATA,
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
  CheckCircle2,
  Download,
  RotateCcw,
  HardDrive,
} from 'lucide-react';

interface ToastState {
  type: 'success' | 'info' | 'error';
  message: string;
}

export default function App() {
  const currentRealWeek = useMemo(() => getWeekKey(new Date()), []);
  const [selectedWeekKey, setSelectedWeekKey] = useState<string>(currentRealWeek);

  const [weekData, setWeekData] = useState<WeekData>(() => getWeekData(currentRealWeek));

  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResponse | null>(null);
  const [aiErrorMessage, setAiErrorMessage] = useState<string | null>(null);

  // 6. Notificaciones claras en español y sin palabras técnicas
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const data = getWeekData(selectedWeekKey);
    setWeekData(data);
  }, [selectedWeekKey]);

  const weekInfo = useMemo(() => getWeekDateRange(selectedWeekKey), [selectedWeekKey]);
  const isCurrentWeek = selectedWeekKey === currentRealWeek;

  const totalSpentCents = useMemo(() => {
    return weekData.expenses.reduce((acc, exp) => acc + exp.amountCents, 0);
  }, [weekData.expenses]);

  const isWeekEmpty = weekData.expenses.length === 0;

  const handleSaveGoal = (cents: number) => {
    const updated = saveWeeklyGoal(selectedWeekKey, cents);
    setWeekData(updated);
    showToast('Meta semanal guardada con éxito.', 'success');
  };

  const handleAddExpense = (amountCents: number, category: string) => {
    const { weekData: updated } = addExpense(selectedWeekKey, amountCents, category);
    setWeekData(updated);
    showToast('Gasto anotado con éxito.', 'success');
  };

  const handleDeleteExpense = (id: string) => {
    const updated = removeExpense(selectedWeekKey, id);
    setWeekData(updated);
    showToast('Gasto eliminado correctamente.', 'info');
  };

  const handleExportBackup = () => {
    exportDataAsJSONFile();
    showToast('Descargando tu archivo de respaldo en la carpeta de descargas.', 'success');
  };

  const handleResetToSample = () => {
    localStorage.setItem('mi_bolsillo_data_v1', JSON.stringify(SAMPLE_INITIAL_DATA));
    setWeekData(getWeekData(selectedWeekKey));
    showToast('Datos de ejemplo listos: Meta $20, Comida $12, Ocio $5, Transporte $4.', 'success');
  };

  // Botón "Revisar mi semana" (Sello de IA)
  const handleReviewWeekClick = async () => {
    if (isWeekEmpty || totalSpentCents <= 0) {
      showToast('Aún no anotaste gastos esta semana. Anotá al menos uno para que podamos analizarlo.', 'info');
      return;
    }

    const effectiveGoalCents = weekData.goalCents > 0 ? weekData.goalCents : 2000;

    setIsAIModalOpen(true);
    setIsAILoading(true);
    setAiErrorMessage(null);
    setAiAnalysis(null);

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
        setAiErrorMessage(result.error || 'No se pudo completar el análisis en este momento.');
      }
    } catch {
      setAiErrorMessage('Hubo una demora al consultar el análisis. Por favor, probá de nuevo en unos segundos.');
    } finally {
      setIsAILoading(false);
    }
  };

  return (
    // 1. Usable desde 320px, con una sola mano, sin desbordamiento horizontal
    <div className="min-h-screen bg-slate-200 flex flex-col font-sans text-slate-950 antialiased overflow-x-hidden">
      {/* Contenedor mobile-first adaptable desde 320px de ancho */}
      <div className="w-full max-w-sm sm:max-w-md mx-auto min-h-screen flex flex-col bg-white border-x-2 border-slate-900 shadow-2xl pb-20">
        
        {/* Cabecera de alto contraste */}
        <header className="bg-white px-4 pt-5 pb-4 border-b-2 border-slate-900 sticky top-0 z-30 shadow-xs">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-12 h-12 bg-slate-950 text-white rounded-2xl flex items-center justify-center shrink-0 border-2 border-slate-900">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-950 tracking-tight leading-none">
                  MI BOLSILLO
                </h1>
                <p className="text-base font-extrabold text-emerald-800 tracking-tight mt-0.5">
                  Finanzas del estudiante
                </p>
              </div>
            </div>

            {/* Botón secundario en cabecera (el único botón primario es Anotar Gasto) */}
            <button
              onClick={handleReviewWeekClick}
              className="min-h-[48px] py-2 px-3.5 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-950 font-black rounded-2xl text-base border-2 border-slate-900 flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Revisar gastos de la semana"
            >
              <Sparkles className="w-5 h-5 text-indigo-700" />
              <span>Revisar</span>
            </button>
          </div>

          {/* Navegador de Semanas */}
          <div className="flex items-center justify-between bg-slate-100 rounded-2xl p-2 border-2 border-slate-900">
            <button
              onClick={() => setSelectedWeekKey(shiftWeekKey(selectedWeekKey, -1))}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-950 hover:bg-white rounded-xl border border-slate-300 transition-colors cursor-pointer"
              aria-label="Ir a la semana anterior"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="text-center flex-1 px-2">
              <div className="flex items-center justify-center gap-1.5">
                <Calendar className="w-5 h-5 text-slate-800" />
                <span className="text-base font-black text-slate-950">
                  {selectedWeekKey}
                </span>
                {isCurrentWeek && (
                  <span className="text-base font-black bg-emerald-700 text-white px-2 py-0.5 rounded-lg">
                    Actual
                  </span>
                )}
              </div>
              <span className="text-base font-bold text-slate-800 block mt-0.5">
                {weekInfo.label}
              </span>
            </div>

            <button
              onClick={() => setSelectedWeekKey(shiftWeekKey(selectedWeekKey, 1))}
              className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-950 hover:bg-white rounded-xl border border-slate-300 transition-colors cursor-pointer"
              aria-label="Ir a la semana siguiente"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </header>

        {/* 6. Mensajes de aviso / éxito / error visibles en español */}
        {toast && (
          <div
            className={`mx-3 sm:mx-4 mt-3 p-4 rounded-2xl text-base font-black flex items-start gap-3 border-2 shadow-md ${
              toast.type === 'success'
                ? 'bg-emerald-100 text-emerald-950 border-emerald-900'
                : toast.type === 'error'
                ? 'bg-rose-100 text-rose-950 border-rose-900'
                : 'bg-amber-100 text-amber-950 border-amber-900'
            }`}
            role="status"
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6 shrink-0 mt-0.5 text-emerald-900" />
            ) : (
              <AlertCircle className="w-6 h-6 shrink-0 mt-0.5 text-slate-950" />
            )}
            <span className="leading-snug">{toast.message}</span>
          </div>
        )}

        <main className="p-3 sm:p-4 space-y-5 flex-1">
          {/* SEMÁFORO INTELIGENTE (Texto claro: vas bien, ya casi llegaste o te pasaste) */}
          <section aria-label="Semáforo de gastos">
            <SemaforoCard
              goalCents={weekData.goalCents}
              spentCents={totalSpentCents}
              onEditGoalClick={() => setIsGoalModalOpen(true)}
            />
          </section>

          {/* Tarjeta de asesoría semanal con botón secundario */}
          <section className="bg-indigo-950 text-white rounded-3xl p-5 border-4 border-slate-900 shadow-md">
            <div className="flex flex-col gap-3">
              <div>
                <span className="inline-block text-base font-black bg-indigo-500/50 text-white px-3 py-1 rounded-xl mb-2 border border-indigo-300">
                  Sello de IA estudiantil
                </span>
                <h2 className="text-xl font-black leading-tight">
                  ¿A dónde se fue tu dinero esta semana?
                </h2>
                <p className="text-base font-semibold text-indigo-100 mt-1">
                  Analiza tus gastos sin tocar lo básico (comida, transporte y útiles).
                </p>
              </div>

              {/* Botón secundario para activar el análisis */}
              <button
                onClick={handleReviewWeekClick}
                className="w-full min-h-[50px] py-3 px-4 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-950 font-black text-base rounded-2xl transition-all border-2 border-white flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Sparkles className="w-5 h-5 text-indigo-700" />
                <span>Revisar mi semana</span>
              </button>
            </div>
          </section>

          {/* 3, 4 y 5: FORMULARIO con etiquetas visibles, estado vacío y el ÚNICO botón primario */}
          <section aria-label="Registrar gasto">
            <ExpenseForm
              onAddExpense={handleAddExpense}
              isWeekEmpty={isWeekEmpty}
            />
          </section>

          {/* LISTADO DE MOVIMIENTOS */}
          <section aria-label="Lista de gastos">
            <ExpenseList
              expenses={weekData.expenses}
              onDeleteExpense={handleDeleteExpense}
            />
          </section>

          {/* RESPALDO Y DATOS LOCALES */}
          <section className="bg-slate-100 rounded-3xl p-5 border-2 border-slate-900 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-slate-800" />
              <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
                Copia de respaldo
              </h3>
            </div>
            <p className="text-base font-semibold text-slate-700 mb-4 leading-relaxed">
              Tus datos quedan guardados en este dispositivo. Podés descargar una copia de seguridad en un archivo para no perder nada.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Botón secundario */}
              <button
                onClick={handleExportBackup}
                className="min-h-[50px] flex-1 py-3 px-4 bg-white hover:bg-slate-50 active:bg-slate-200 text-slate-950 font-black rounded-2xl text-base border-2 border-slate-900 flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <Download className="w-5 h-5" />
                <span>Exportar (.json)</span>
              </button>

              {/* Botón secundario */}
              <button
                onClick={handleResetToSample}
                className="min-h-[50px] flex-1 py-3 px-4 bg-slate-200 hover:bg-slate-300 text-slate-950 font-black rounded-2xl text-base border-2 border-slate-400 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-5 h-5 text-slate-700" />
                <span>Cargar ejemplo</span>
              </button>
            </div>
          </section>
        </main>

        {/* Modal de fijar meta */}
        <GoalModal
          isOpen={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          currentGoalCents={weekData.goalCents}
          onSaveGoal={handleSaveGoal}
          weekLabel={weekInfo.label}
        />

        {/* Modal del Sello de IA */}
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
