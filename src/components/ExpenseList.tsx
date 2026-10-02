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
        return <Utensils className="w-4 h-4 text-emerald-600" />;
      case 'Transporte':
        return <Bus className="w-4 h-4 text-emerald-600" />;
      case 'Útiles':
        return <BookOpen className="w-4 h-4 text-emerald-600" />;
      case 'Ocio':
        return <Gamepad2 className="w-4 h-4 text-indigo-600" />;
      case 'Snacks & Salidas':
        return <Coffee className="w-4 h-4 text-amber-600" />;
      default:
        return <Tag className="w-4 h-4 text-slate-600" />;
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 text-center py-8">
        <p className="text-slate-400 text-sm font-medium">
          No hay gastos anotados en esta semana.
        </p>
        <p className="text-xs text-slate-400 mt-1">
          Registrá lo que vayas gastando en el día arriba.
        </p>
      </div>
    );
  }

  // Agrupación por categoría para ver los totales rápidos
  const categoryTotalsMap = expenses.reduce((acc, exp) => {
    acc[exp.category] = (acc[exp.category] || 0) + exp.amountCents;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-4">
      {/* Resumen por categorías en chips */}
      <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          ¿En qué se está yendo el dinero?
        </span>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(categoryTotalsMap).map(([cat, totalCents]) => {
            const isProt = isCategoryProtected(cat);
            return (
              <div
                key={cat}
                className={`flex items-center gap-1.5 text-xs py-1.5 px-3 rounded-xl border ${
                  isProt
                    ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <span>{cat}:</span>
                <span className="font-bold">{formatCents(totalCents)}</span>
                {isProt && (
                  <span title="Categoría protegida">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Historial detallado de gastos */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-slate-800 text-sm">
            Movimientos ({expenses.length})
          </h3>
          <span className="text-[11px] text-slate-400">Esta semana</span>
        </div>

        <div className="divide-y divide-slate-100">
          {expenses.map((expense) => {
            const isProtected = isCategoryProtected(expense.category);
            return (
              <div
                key={expense.id}
                className="py-3 flex items-center justify-between group hover:bg-slate-50/80 -mx-2 px-2 rounded-xl transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                      isProtected ? 'bg-emerald-50' : 'bg-slate-100'
                    }`}
                  >
                    {getIcon(expense.category)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-slate-800">
                        {expense.category}
                      </span>
                      {isProtected && (
                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                          Básica
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {formatExpenseDate(expense.date)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCents(expense.amountCents)}
                  </span>
                  <button
                    onClick={() => onDeleteExpense(expense.id)}
                    className="p-1.5 text-slate-300 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                    title="Eliminar gasto"
                    aria-label="Eliminar gasto"
                  >
                    <Trash2 className="w-4 h-4" />
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
