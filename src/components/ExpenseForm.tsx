/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { APP_CATEGORIES } from '../types';
import { parseInputToCents } from '../utils/currencyUtils';
import { PlusCircle, Shield, Utensils, Bus, BookOpen, Gamepad2, Coffee, Tag, AlertCircle } from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (amountCents: number, category: string) => void;
  isWeekEmpty: boolean;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense, isWeekEmpty }) => {
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Comida');
  const [errorMessage, setErrorMessage] = useState('');

  // Iconos representativos para cada categoría
  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'Comida':
        return <Utensils className="w-5 h-5" />;
      case 'Transporte':
        return <Bus className="w-5 h-5" />;
      case 'Útiles':
        return <BookOpen className="w-5 h-5" />;
      case 'Ocio':
        return <Gamepad2 className="w-5 h-5" />;
      case 'Snacks & Salidas':
        return <Coffee className="w-5 h-5" />;
      default:
        return <Tag className="w-5 h-5" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseInputToCents(amountInput);

    if (cents <= 0) {
      setErrorMessage('Por favor, escribí un monto mayor a cero para anotar el gasto.');
      return;
    }

    if (!selectedCategory) {
      setErrorMessage('Por favor, elegí en qué categoría hiciste el gasto.');
      return;
    }

    onAddExpense(cents, selectedCategory);
    setAmountInput('');
    setErrorMessage('');
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-slate-900 shadow-md space-y-4">
      {/* 5. Estado vacío: cuando todavía no hay ningún gasto, mostrar la frase requerida junto al formulario */}
      {isWeekEmpty && (
        <div
          className="bg-amber-100 border-2 border-amber-900 rounded-2xl p-4 text-amber-950 flex items-start gap-3 shadow-xs"
          role="status"
        >
          <AlertCircle className="w-6 h-6 text-amber-900 shrink-0 mt-0.5" />
          <p className="text-base font-bold leading-snug">
            Todavía no anotaste gastos esta semana. Anotá el primero.
          </p>
        </div>
      )}

      <div>
        <h3 className="text-xl font-black text-slate-950 tracking-tight">
          Anotar nuevo gasto
        </h3>
        <p className="text-base font-semibold text-slate-700 mt-0.5">
          La fecha y la hora se guardan solas automáticamente.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 3. Etiqueta visible (no solo placeholder) */}
        <div>
          <label
            htmlFor="expense-amount-input"
            className="block text-base font-black text-slate-900 mb-2"
          >
            Monto gastado ($)
          </label>
          <div className="relative">
            <span
              className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-900"
              aria-hidden="true"
            >
              $
            </span>
            {/* Texto nunca menor a 16px (evita zoom automático en celulares) */}
            <input
              id="expense-amount-input"
              type="number"
              step="0.01"
              min="0.01"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setErrorMessage('');
              }}
              placeholder="Ejemplo: 12.00"
              className="w-full min-h-[56px] pl-10 pr-4 py-3 bg-slate-50 border-2 border-slate-900 rounded-2xl text-2xl font-black text-slate-950 focus:bg-white focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all placeholder:text-slate-500 placeholder:font-normal"
            />
          </div>
          {/* 6. Mensaje de error visible, en español, sin tecnicismos */}
          {errorMessage && (
            <p className="text-base font-bold text-rose-700 mt-2 flex items-center gap-1.5" role="alert">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>

        {/* 3. Selector de categoría con etiqueta visible */}
        <div>
          <label className="block text-base font-black text-slate-900 mb-2">
            Categoría del gasto
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {APP_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`min-h-[56px] p-3 rounded-2xl text-left border-2 transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'bg-slate-950 border-slate-950 text-white shadow-md'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-400 text-slate-950'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`p-2 rounded-xl border ${
                        isSelected
                          ? 'bg-white/20 text-white border-white/30'
                          : 'bg-white text-slate-900 border-slate-300'
                      }`}
                    >
                      {getCategoryIcon(cat.name)}
                    </span>
                    <span className="text-base font-extrabold">
                      {cat.name}
                    </span>
                  </div>

                  {cat.isProtected && (
                    <span
                      className={`text-base font-bold px-2 py-0.5 rounded-lg border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-400'
                          : 'bg-emerald-100 text-emerald-950 border-emerald-300'
                      }`}
                      title="Categoría protegida que no se recortará"
                    >
                      Básica
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. ÚNICO BOTÓN PRINCIPAL DE LA PANTALLA: Anotar gasto */}
        <button
          type="submit"
          className="w-full min-h-[58px] py-4 px-6 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black rounded-2xl text-lg sm:text-xl transition-all shadow-lg border-2 border-emerald-950 flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <PlusCircle className="w-6 h-6 shrink-0" />
          <span>Anotar gasto en {selectedCategory}</span>
        </button>
      </form>
    </div>
  );
};
