/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { formatCents, parseInputToCents } from '../utils/currencyUtils';
import { Target, X, Check } from 'lucide-react';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentGoalCents: number;
  onSaveGoal: (cents: number) => void;
  weekLabel: string;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  currentGoalCents,
  onSaveGoal,
  weekLabel,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentGoalCents > 0) {
        setInputValue((currentGoalCents / 100).toString());
      } else {
        setInputValue('20'); // Valor sugerido inicial para la semana
      }
      setError('');
    }
  }, [isOpen, currentGoalCents]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseInputToCents(inputValue);

    if (cents <= 0) {
      setError('Por favor, ingresá un monto mayor a 0');
      return;
    }

    onSaveGoal(cents);
    onClose();
  };

  const presetGoals = [15, 20, 30, 50];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Fijar Meta Semanal</h3>
            <p className="text-xs text-slate-500">{weekLabel}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Presupuesto total para la semana ($)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError('');
                }}
                placeholder="20.00"
                autoFocus
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-2xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>
            {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          {/* Accesos rápidos */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Valores rápidos
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {presetGoals.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => {
                    setInputValue(val.toString());
                    setError('');
                  }}
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    inputValue === val.toString()
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-2xl text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-semibold rounded-2xl text-sm transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar meta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
