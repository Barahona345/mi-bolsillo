/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { parseInputToCents } from '../utils/currencyUtils';
import { Target, X, Check, AlertCircle } from 'lucide-react';

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
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentGoalCents > 0) {
        setInputValue((currentGoalCents / 100).toString());
      } else {
        setInputValue('20');
      }
      setErrorMessage('');
    }
  }, [isOpen, currentGoalCents]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseInputToCents(inputValue);

    if (cents <= 0) {
      setErrorMessage('Por favor, ingresá un monto mayor a cero para fijar tu meta.');
      return;
    }

    onSaveGoal(cents);
    onClose();
  };

  const presetGoals = [15, 20, 30, 50];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="goal-modal-title"
    >
      <div className="bg-white w-full max-w-sm rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-800 hover:text-slate-950 rounded-2xl hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
          aria-label="Cerrar ventana de meta"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3 mb-4 pr-12">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-950 rounded-2xl flex items-center justify-center border-2 border-emerald-900 shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h2 id="goal-modal-title" className="font-black text-slate-950 text-xl leading-tight">
              Fijar meta semanal
            </h2>
            <p className="text-base font-semibold text-slate-700">{weekLabel}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 3. Etiqueta visible */}
          <div>
            <label
              htmlFor="weekly-goal-input"
              className="block text-base font-black text-slate-950 mb-2"
            >
              Presupuesto total para la semana ($)
            </label>
            <div className="relative">
              <span
                className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-900"
                aria-hidden="true"
              >
                $
              </span>
              <input
                id="weekly-goal-input"
                type="number"
                step="0.01"
                min="1"
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setErrorMessage('');
                }}
                placeholder="20.00"
                autoFocus
                className="w-full min-h-[56px] pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-2xl text-2xl font-black text-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all placeholder:text-slate-500"
              />
            </div>
            {/* 6. Mensaje de error sin tecnicismos */}
            {errorMessage && (
              <p className="text-base font-bold text-rose-700 mt-2 flex items-center gap-1.5" role="alert">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </p>
            )}
          </div>

          <div>
            <span className="text-base font-bold text-slate-900 block mb-2">
              Montos rápidos sugeridos:
            </span>
            <div className="grid grid-cols-4 gap-2">
              {presetGoals.map((val) => (
                <button
                  type="button"
                  key={val}
                  onClick={() => {
                    setInputValue(val.toString());
                    setErrorMessage('');
                  }}
                  className={`min-h-[48px] py-2 px-2 rounded-xl text-base font-black border-2 transition-all cursor-pointer ${
                    inputValue === val.toString()
                      ? 'bg-emerald-200 border-emerald-900 text-emerald-950 shadow-xs'
                      : 'bg-slate-100 border-slate-400 text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  ${val}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {/* Botón secundario */}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[50px] flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-950 font-bold rounded-2xl text-base border-2 border-slate-400 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            {/* 4. Único botón principal de este modal */}
            <button
              type="submit"
              className="min-h-[50px] flex-1 py-3 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-2xl text-base border-2 border-emerald-950 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Check className="w-5 h-5" />
              <span>Guardar meta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
