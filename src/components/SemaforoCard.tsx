/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { formatCents } from '../utils/currencyUtils';
import { CheckCircle2, AlertTriangle, AlertOctagon, Pencil } from 'lucide-react';

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
  // Caso 0: Todavía no fijó meta semanal
  if (!goalCents || goalCents <= 0) {
    return (
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-900 shadow-sm text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-900 border-2 border-amber-900">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="font-extrabold text-slate-950 text-xl mb-2">
          Fijá tu meta semanal de gasto
        </h2>
        <p className="text-base font-semibold text-slate-800 mb-5 leading-relaxed">
          Anotá cuánto dinero tenés disponible para la semana para activar el semáforo.
        </p>
        {/* Botón secundario para fijar meta (el único botón primario de la pantalla es Anotar Gasto) */}
        <button
          onClick={onEditGoalClick}
          className="w-full min-h-[52px] py-3.5 px-6 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-950 font-bold rounded-2xl text-base border-2 border-slate-900 transition-colors cursor-pointer"
        >
          Fijar meta ahora
        </button>
      </div>
    );
  }

  // Cálculos de porcentajes y umbrales (70% y 100%)
  const percentage = Math.round((spentCents / goalCents) * 100);
  const excessCents = Math.max(0, spentCents - goalCents);
  const remainingCents = Math.max(0, goalCents - spentCents);

  let status: 'safe' | 'warning' | 'danger';
  if (spentCents >= goalCents) {
    status = 'danger'; // Rojo al llegar o pasarse del 100 %
  } else if (spentCents >= goalCents * 0.7) {
    status = 'warning'; // Amarillo desde el 70 % hasta antes del 100 %
  } else {
    status = 'safe'; // Verde por debajo del 70 %
  }

  // El semáforo no depende solo del color:
  // Dice explícitamente con texto claro si vas bien, si ya casi llegaste o si te pasaste
  let estadoTextoClaridad = '';
  let statusHeadline = '';
  let statusSubline = '';

  if (status === 'danger') {
    estadoTextoClaridad = 'TE PASASTE DE LA META';
    if (excessCents > 0) {
      statusHeadline = `Te pasaste ${formatCents(excessCents)}`;
      statusSubline = `Superaste tu presupuesto semanal por ${formatCents(excessCents)}`;
    } else {
      statusHeadline = `Llegaste a tu meta (${formatCents(goalCents)})`;
      statusSubline = `Alcanzaste el 100% de tu dinero disponible`;
    }
  } else if (status === 'warning') {
    estadoTextoClaridad = 'YA CASI LLEGASTE A LA META';
    statusHeadline = `Te quedan ${formatCents(remainingCents)}`;
    statusSubline = `Atención: ya usaste el ${percentage}% de tu presupuesto`;
  } else {
    estadoTextoClaridad = 'VAS BIEN';
    statusHeadline = `Te quedan ${formatCents(remainingCents)}`;
    statusSubline = `Bajo control: usaste el ${percentage}% de tu presupuesto`;
  }

  // Estilos de alto contraste para visibilidad bajo la luz del sol
  const statusStyles = {
    safe: {
      cardBg: 'bg-emerald-50',
      border: 'border-emerald-900',
      badgeBg: 'bg-emerald-900 text-white',
      textColor: 'text-emerald-950',
      progressBg: 'bg-emerald-600',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-900" />,
    },
    warning: {
      cardBg: 'bg-amber-50',
      border: 'border-amber-900',
      badgeBg: 'bg-amber-950 text-white',
      textColor: 'text-amber-950',
      progressBg: 'bg-amber-500',
      icon: <AlertTriangle className="w-6 h-6 text-amber-950" />,
    },
    danger: {
      cardBg: 'bg-rose-50',
      border: 'border-rose-900',
      badgeBg: 'bg-rose-900 text-white',
      textColor: 'text-rose-950',
      progressBg: 'bg-rose-600',
      icon: <AlertOctagon className="w-6 h-6 text-rose-950" />,
    },
  }[status];

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 border-4 shadow-md transition-all ${statusStyles.cardBg} ${statusStyles.border}`}
      role="region"
      aria-label="Semáforo semanal de gastos"
    >
      {/* Fila superior: Luz visual + Botón secundario para ajustar la meta */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Semáforo físico con alto contraste y etiqueta textual accesible */}
        <div className="flex items-center gap-2 bg-slate-950 px-3.5 py-2 rounded-full border border-slate-800">
          <div
            className={`w-5 h-5 rounded-full transition-all ${
              status === 'danger'
                ? 'bg-rose-500 ring-2 ring-white scale-110 shadow-md'
                : 'bg-rose-950 opacity-40'
            }`}
            title="Luz roja (Límite superado)"
          />
          <div
            className={`w-5 h-5 rounded-full transition-all ${
              status === 'warning'
                ? 'bg-amber-400 ring-2 ring-white scale-110 shadow-md'
                : 'bg-amber-950 opacity-40'
            }`}
            title="Luz amarilla (Casi en el límite)"
          />
          <div
            className={`w-5 h-5 rounded-full transition-all ${
              status === 'safe'
                ? 'bg-emerald-400 ring-2 ring-white scale-110 shadow-md'
                : 'bg-emerald-950 opacity-40'
            }`}
            title="Luz verde (Bajo control)"
          />
        </div>

        {/* Botón secundario para editar meta */}
        <button
          onClick={onEditGoalClick}
          className="min-h-[48px] py-2 px-4 bg-white hover:bg-slate-100 text-slate-950 font-bold text-base rounded-2xl border-2 border-slate-900 flex items-center gap-2 cursor-pointer shadow-xs"
          aria-label={`Meta actual: ${formatCents(goalCents)}. Tocar para cambiar.`}
        >
          <span>Meta: {formatCents(goalCents)}</span>
          <Pencil className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      {/* Cartel textual explícito: NO DEPENDE SOLO DEL COLOR */}
      <div className="mb-3">
        <span
          className={`inline-block font-black text-base px-3.5 py-1.5 rounded-xl uppercase tracking-wide border-2 border-slate-900 ${statusStyles.badgeBg}`}
        >
          {estadoTextoClaridad}
        </span>
      </div>

      {/* Titular principal con números grandes de alto contraste */}
      <div className="mb-4">
        <h2 className={`text-3xl sm:text-4xl font-black tracking-tight leading-tight ${statusStyles.textColor}`}>
          {statusHeadline}
        </h2>
        <p className="text-base font-bold text-slate-800 mt-1 leading-snug">
          {statusSubline}
        </p>
      </div>

      {/* Barra de progreso visual con borde de alto contraste */}
      <div
        className="w-full bg-white h-5 rounded-full overflow-hidden p-0.5 border-2 border-slate-900 mb-4"
        aria-hidden="true"
      >
        <div
          className={`h-full rounded-full transition-all duration-300 ${statusStyles.progressBg}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>

      {/* Tarjetas comparativas inferiores */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t-2 border-slate-900/20 text-slate-950">
        <div className="bg-white rounded-2xl p-3 border-2 border-slate-900 text-center">
          <span className="text-base font-bold text-slate-700 block">Total gastado</span>
          <span className="text-xl sm:text-2xl font-black text-slate-950 block">
            {formatCents(spentCents)}
          </span>
        </div>
        <div className="bg-white rounded-2xl p-3 border-2 border-slate-900 text-center">
          <span className="text-base font-bold text-slate-700 block">Meta fijada</span>
          <span className="text-xl sm:text-2xl font-black text-slate-950 block">
            {formatCents(goalCents)}
          </span>
        </div>
      </div>
    </div>
  );
};
