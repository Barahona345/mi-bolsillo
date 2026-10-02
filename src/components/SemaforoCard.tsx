/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { formatCents } from '../utils/currencyUtils';
import { AlertTriangle, CheckCircle2, Flame, ShieldAlert } from 'lucide-react';

interface SemaforoCardProps {
  goalCents: number;
  spentCents: number;
  onEditGoalClick: () => void;
}

export const SemaforoCard: React.FC<SemaforoCardProps> = ({
  goalCents,
  spentCents,
  onEditGoalClick,
}) => {
  // Caso 0: Aún no fijó una meta semanal
  if (!goalCents || goalCents <= 0) {
    return (
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 text-center">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-3 text-amber-500">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-800 text-base mb-1">
          Fijá tu meta semanal de gasto
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Definí cuánto dinero tenés disponible para la semana para activar el semáforo inteligente.
        </p>
        <button
          onClick={onEditGoalClick}
          className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-medium rounded-xl text-sm transition-all shadow-sm shadow-emerald-200"
        >
          Fijar meta ahora
        </button>
      </div>
    );
  }

  // Cálculos del semáforo
  const percentage = Math.round((spentCents / goalCents) * 100);
  const isOver = spentCents > goalCents;
  const excessCents = isOver ? spentCents - goalCents : 0;
  const remainingCents = !isOver ? goalCents - spentCents : 0;

  // Estado del semáforo:
  // - 'danger' (Rojo): gastó más del 100% de la meta
  // - 'warning' (Amarillo): gastó entre 80% y 100% (se acerca a la meta)
  // - 'safe' (Verde): gastó menos del 80%
  let status: 'safe' | 'warning' | 'danger';
  if (isOver) {
    status = 'danger';
  } else if (percentage >= 80) {
    status = 'warning';
  } else {
    status = 'safe';
  }

  // Texto principal del semáforo según el criterio de aceptación:
  // "veo el semáforo en rojo con 'Te pasaste $1.00'"
  let statusHeadline = '';
  let statusSubline = '';

  if (status === 'danger') {
    statusHeadline = `Te pasaste ${formatCents(excessCents)}`;
    statusSubline = `Superaste tu meta de ${formatCents(goalCents)} por ${formatCents(excessCents)}`;
  } else if (status === 'warning') {
    statusHeadline = `Te quedan ${formatCents(remainingCents)}`;
    statusSubline = `Cuidado, ya usaste el ${percentage}% de tu meta`;
  } else {
    statusHeadline = `Te quedan ${formatCents(remainingCents)}`;
    statusSubline = `Vas bien, gastaste el ${percentage}% de tu meta`;
  }

  // Estilos visuales dinámicos
  const statusStyles = {
    safe: {
      bg: 'bg-emerald-500',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      progressBg: 'bg-emerald-500',
      accentText: 'text-emerald-700',
      lightColor: 'bg-emerald-500 shadow-emerald-400',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      label: 'Zona Verde (Bajo control)',
    },
    warning: {
      bg: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      progressBg: 'bg-amber-500',
      accentText: 'text-amber-700',
      lightColor: 'bg-amber-400 shadow-amber-300',
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      label: 'Zona Amarilla (Cerca del límite)',
    },
    danger: {
      bg: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      progressBg: 'bg-rose-500',
      accentText: 'text-rose-700',
      lightColor: 'bg-rose-500 shadow-rose-400',
      icon: <ShieldAlert className="w-5 h-5 text-rose-600" />,
      label: 'Zona Roja (Meta superada)',
    },
  }[status];

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 transition-all">
      {/* Cabecera del semáforo con luz física simulada */}
      <div className="flex items-center justify-between mb-4">
        {/* Luces del semáforo físico */}
        <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-full shadow-inner">
          {/* Luz Roja */}
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              status === 'danger'
                ? 'bg-rose-500 shadow-[0_0_10px_#f43f5e] scale-110'
                : 'bg-rose-950/70 opacity-40'
            }`}
            title="Luz roja (Límite superado)"
          />
          {/* Luz Amarilla */}
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              status === 'warning'
                ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24] scale-110'
                : 'bg-amber-950/70 opacity-40'
            }`}
            title="Luz amarilla (Cerca de la meta)"
          />
          {/* Luz Verde */}
          <div
            className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
              status === 'safe'
                ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] scale-110'
                : 'bg-emerald-950/70 opacity-40'
            }`}
            title="Luz verde (Dentro de la meta)"
          />
        </div>

        {/* Botón para ajustar meta */}
        <button
          onClick={onEditGoalClick}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
        >
          <span>Meta: {formatCents(goalCents)}</span>
          <span className="text-[10px] text-slate-400">✏️</span>
        </button>
      </div>

      {/* Titular principal del semáforo */}
      <div className="mb-4">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-xs uppercase tracking-wider font-bold text-slate-400">
            Estado del Semáforo
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {spentCents > 0 ? `${percentage}% utilizado` : 'Sin gastos'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Texto requerido por criterio de aceptación cuando se pasa de la meta */}
          <h2
            className={`text-2xl sm:text-3xl font-black tracking-tight ${
              status === 'danger'
                ? 'text-rose-600'
                : status === 'warning'
                ? 'text-amber-600'
                : 'text-emerald-600'
            }`}
          >
            {statusHeadline}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">{statusSubline}</p>
      </div>

      {/* Barra de progreso visual */}
      <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden p-0.5 mb-3 border border-slate-200/60">
        <div
          className={`h-full rounded-full transition-all duration-500 ${statusStyles.progressBg}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Comparativa rápida en pie de tarjeta */}
      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-center">
        <div className="bg-slate-50 rounded-xl py-2 px-3">
          <span className="text-[11px] text-slate-400 block font-medium">Gastado</span>
          <span className="text-sm font-bold text-slate-800">{formatCents(spentCents)}</span>
        </div>
        <div className="bg-slate-50 rounded-xl py-2 px-3">
          <span className="text-[11px] text-slate-400 block font-medium">Meta semanal</span>
          <span className="text-sm font-bold text-slate-800">{formatCents(goalCents)}</span>
        </div>
      </div>
    </div>
  );
};
