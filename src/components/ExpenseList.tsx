/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Expense } from '../types';
import { formatCents } from '../utils/currencyUtils';
import { formatExpenseDate } from '../utils/dateUtils';
import { isCategoryProtected } from '../services/aiService';
import { Trash2, Utensils, Bus, BookOpen, Gamepad2, Coffee, Tag, ShieldCheck } from 'lucide-react';

interface ExpenseListProps {
  expenses: Expense[];
  onDeleteExpense: (id: string) => void;
}

export const ExpenseList: React.FC<ExpenseListProps> = ({ expenses, onDeleteExpense }) => {
  const getIcon = (category: string) => {
    switch (category) {
      case 'Comida':
        return <Utensils className="w-5 h-5 text-emerald-900" />;
      case 'Transporte':
        return <Bus className="w-5 h-5 text-emerald-900" />;
      case 'Útiles':
        return <BookOpen className="w-5 h-5 text-emerald-900" />;
      case 'Ocio':
        return <Gamepad2 className="w-5 h-5 text-indigo-900" />;
      case 'Snacks & Salidas':
        return <Coffee className="w-5 h-5 text-amber-900" />;
      default:
        return <Tag className="w-5 h-5 text-slate-900" />;
    }
  };

  if (expenses.length === 0) {
    return null; // El estado vacío se muestra junto al formulario según el punto 5
  }

  // Agrupación por categoría
  const categoryTotalsMap = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amountCents;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Resumen por categorías en alto contraste y texto >= 16px */}
      <div className="bg-white rounded-3xl p-5 border-2 border-slate-900 shadow-sm">
        <h3 className="text-base font-black text-slate-900 uppercase tracking-wide block mb-3">
          ¿En qué se está yendo el dinero?
        </h3>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryTotalsMap).map(([cat, totalCents]) => {
            const isProt = isCategoryProtected(cat);
            return (
              <div
                key={cat}
                className={`flex items-center gap-2 text-base py-2 px-3.5 rounded-xl border-2 font-bold ${
                  isProt
                    ? 'bg-emerald-100 border-emerald-900 text-emerald-950'
                    : 'bg-slate-100 border-slate-900 text-slate-950'
                }`}
              >
                <span>{cat}:</span>
                <span className="font-black">{formatCents(totalCents)}</span>
                {isProt && (
                  <span title="Categoría básica">
                    <ShieldCheck className="w-5 h-5 text-emerald-900 inline" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial detallado de gastos */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-900 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-black text-slate-950">
            Gastos anotados ({expenses.length})
          </h3>
          <span className="text-base font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl border border-slate-400">
            Esta semana
          </span>
        </div>

        <div className="divide-y-2 divide-slate-200">
          {expenses.map((expense) => {
            const isProtected = isCategoryProtected(expense.category);
            return (
              <div
                key={expense.id}
                className="py-4 flex items-center justify-between gap-3 group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                      isProtected
                        ? 'bg-emerald-100 border-emerald-900'
                        : 'bg-slate-100 border-slate-400'
                    }`}
                  >
                    {getIcon(expense.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-950">
                        {expense.category}
                      </span>
                      {isProtected && (
                        <span className="text-base font-bold text-emerald-950 bg-emerald-200 px-2 py-0.5 rounded-lg border border-emerald-800">
                          Básica
                        </span>
                      )}
                    </div>
                    <span className="text-base font-bold text-slate-700 block mt-0.5">
                      {formatExpenseDate(expense.date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-slate-950">
                    {formatCents(expense.amountCents)}
                  </span>
                  {/* Botón táctil accesible de mínimo 48x48 px */}
                  <button
                    onClick={() => onDeleteExpense(expense.id)}
                    className="min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-600 hover:text-rose-700 active:text-rose-900 rounded-xl hover:bg-rose-50 border border-slate-300 hover:border-rose-400 transition-colors cursor-pointer"
                    title="Eliminar gasto"
                    aria-label={`Eliminar gasto de ${expense.category} de ${formatCents(expense.amountCents)}`}
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
