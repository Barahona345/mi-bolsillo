/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AIAnalysisResponse } from '../types';
import { formatCents } from '../utils/currencyUtils';
import { Sparkles, ShieldCheck, X, AlertCircle, ArrowDownCircle, Lightbulb } from 'lucide-react';

interface AIReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  analysis: AIAnalysisResponse | null;
  errorMessage: string | null;
  totalSpentCents: number;
  goalCents: number;
}

export const AIReviewModal: React.FC<AIReviewModalProps> = ({
  isOpen,
  onClose,
  isLoading,
  analysis,
  errorMessage,
  totalSpentCents,
  goalCents,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          aria-label="Cerrar análisis"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Cabecera del Sello de IA */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 shadow-xs">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-extrabold text-slate-800 text-lg">Revisar mi semana</h3>
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                IA Mentor
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Análisis inteligente protegiendo siempre tus necesidades básicas
            </p>
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="py-12 text-center space-y-4">
            <div className="relative w-14 h-14 mx-auto">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
              <Sparkles className="w-6 h-6 text-indigo-600 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">Analizando tus números...</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Verificando categorías protegidas (Comida, Transporte, Útiles) y buscando dónde recortar en ocio.
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de error si la llamada falló completamente */}
        {!isLoading && errorMessage && (
          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-800 text-base">Aviso</p>
              <p className="text-xs text-slate-600 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Contenido del análisis cuando esté listo */}
        {!isLoading && !errorMessage && analysis && (
          <div className="space-y-4">
            {/* Garantía de protección de necesidades básicas */}
            <div className="bg-emerald-50/80 border border-emerald-200/80 rounded-2xl p-3.5 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="text-xs font-bold text-emerald-900 block">
                  Regla de Oro Estudiantil Activada
                </span>
                <p className="text-[11px] text-emerald-700 leading-relaxed mt-0.5">
                  Tus gastos de <strong>Comida, Transporte y Útiles</strong> están 100% blindados. La IA no te propone recortar en lo que necesitás para el día a día.
                </p>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Diagnóstico de tu semana
              </span>
              <p className="text-sm font-semibold text-slate-700 leading-snug">
                {analysis.diagnosis}
              </p>
            </div>

            {/* Propuestas de recorte con montos concretos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowDownCircle className="w-4 h-4 text-indigo-600" />
                  Propuestas de Recorte Concretas
                </span>
                <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Solo no esenciales
                </span>
              </div>

              {analysis.recommendations.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
                  <p className="text-xs font-semibold text-slate-600">
                    No se sugieren recortes en tus gastos no esenciales esta semana.
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Tus gastos están en categorías básicas protegidas o dentro de tu presupuesto.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {analysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5 hover:border-indigo-200 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-black text-indigo-900">
                          {rec.category}
                        </span>
                        <span className="text-xs font-black text-indigo-600 bg-white px-2 py-0.5 rounded-lg border border-indigo-100 shadow-2xs">
                          Recortar {formatCents(rec.cutAmountCents)}
                        </span>
                      </div>

                      {/* Explicación con formato concreto requerido (ej: 'Ocio: bajá $4 de $5') */}
                      <p className="text-sm font-bold text-slate-800 leading-snug">
                        {rec.explanation}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-indigo-100/60">
                        <span>Gastado actual: {formatCents(rec.currentSpentCents)}</span>
                        <span>
                          Quedaría en: {formatCents(Math.max(0, rec.currentSpentCents - rec.cutAmountCents))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tip de ahorro */}
            {analysis.savingsTip && (
              <div className="bg-amber-50/70 border border-amber-200/60 rounded-2xl p-3 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900 leading-snug">
                  <strong>Tip de bolsillo:</strong> {analysis.savingsTip}
                </p>
              </div>
            )}

            {/* Aviso de respaldo si existió */}
            {analysis.disclaimer && (
              <p className="text-[10px] text-slate-400 text-center italic">
                {analysis.disclaimer}
              </p>
            )}

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-2xl text-sm transition-all shadow-md cursor-pointer mt-2"
            >
              Entendido, gracias
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
