/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { APP_CATEGORIES } from '../types';
import { parseInputToCents } from '../utils/currencyUtils';
import { PlusCircle, Shield, Utensils, Bus, BookOpen, Gamepad2, Coffee, Tag } from 'lucide-react';

interface ExpenseFormProps {
  onAddExpense: (amountCents: number, category: string) => void;
}

export const ExpenseForm: React.FC<ExpenseFormProps> = ({ onAddExpense }) => {
  const [amountInput, setAmountInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Comida');
  const [error, setError] = useState('');

  // Icon mapping para cada categoría
  const getCategoryIcon = (name: string) => {
    switch (name) {
      case 'Comida':
        return <Utensils className="w-4 h-4" />;
      case 'Transporte':
        return <Bus className="w-4 h-4" />;
      case 'Útiles':
        return <BookOpen className="w-4 h-4" />;
      case 'Ocio':
        return <Gamepad2 className="w-4 h-4" />;
      case 'Snacks & Salidas':
        return <Coffee className="w-4 h-4" />;
      default:
        return <Tag className="w-4 h-4" />;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cents = parseInputToCents(amountInput);

    if (cents <= 0) {
      setError('Ingresá un monto válido para el gasto');
      return;
    }

    if (!selectedCategory) {
      setError('Elegí una categoría');
      return;
    }

    // Registrar gasto (la fecha se guarda sola en el servicio de almacenamiento)
    onAddExpense(cents, selectedCategory);

    // Resetear formulario
    setAmountInput('');
    setError('');
  };

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-slate-800 text-sm tracking-tight flex items-center gap-1.5">
          <span>Registrar nuevo gasto</span>
        </h3>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
          Fecha automática
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Campo de monto */}
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1">
            Monto a gastar ($)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
              $
            </span>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={amountInput}
              onChange={(e) => {
                setAmountInput(e.target.value);
                setError('');
              }}
              placeholder="0.00"
              className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xl font-black text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all placeholder:text-slate-300"
            />
          </div>
          {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
        </div>

        {/* Selector de categoría */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-500">
              Categoría
            </label>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Básicas protegidas de recortes
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {APP_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <button
                  type="button"
                  key={cat.name}
                  onClick={() => setSelectedCategory(cat.name)}
                  className={`p-2.5 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span
                      className={`p-1.5 rounded-xl ${
                        isSelected
                          ? 'bg-white/10 text-white'
                          : cat.isProtected
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {getCategoryIcon(cat.name)}
                    </span>
                    {cat.isProtected && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isSelected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}
                        title="Categoría básica necesaria: La IA no propondrá recortes aquí"
                      >
                        Básica
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold truncate block">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón de acción */}
        <button
          type="submit"
          className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-bold rounded-2xl text-sm transition-all shadow-md shadow-emerald-200 flex items-center justify-center gap-2 cursor-pointer"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Anotar gasto en {selectedCategory}</span>
        </button>
      </form>
    </div>
  );
};
