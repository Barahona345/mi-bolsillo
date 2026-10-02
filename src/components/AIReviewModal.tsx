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
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-review-title"
    >
      <div className="bg-white w-full max-w-md rounded-3xl p-5 sm:p-6 border-4 border-slate-900 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 min-w-[48px] min-h-[48px] flex items-center justify-center text-slate-800 hover:text-slate-950 rounded-2xl hover:bg-slate-100 border border-slate-300 transition-colors cursor-pointer"
          aria-label="Cerrar análisis"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Cabecera */}
        <div className="flex items-center gap-3 mb-4 pr-12">
          <div className="w-12 h-12 bg-indigo-100 text-indigo-950 rounded-2xl flex items-center justify-center shrink-0 border-2 border-indigo-900">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h2 id="ai-review-title" className="font-black text-slate-950 text-xl leading-tight">
              Revisar mi semana
            </h2>
            <p className="text-base font-semibold text-slate-700">
              Análisis cuidando siempre tus gastos básicos
            </p>
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="py-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
            <div>
              <p className="font-black text-slate-950 text-lg">Analizando tus números...</p>
              <p className="text-base font-semibold text-slate-700 mt-1 max-w-xs mx-auto">
                Comprobando que la comida, el transporte y los útiles estén protegidos.
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de error sin tecnicismos */}
        {!isLoading && errorMessage && (
          <div className="py-6 text-center space-y-4">
            <div className="w-14 h-14 bg-rose-100 text-rose-900 rounded-full flex items-center justify-center mx-auto border-2 border-rose-900">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-lg">Aviso</h3>
              <p className="text-base font-semibold text-slate-800 mt-1">{errorMessage}</p>
            </div>
            <button
              onClick={onClose}
              className="w-full min-h-[50px] px-6 py-3 bg-slate-950 text-white rounded-2xl text-base font-black border-2 border-black cursor-pointer"
            >
              Entendido
            </button>
          </div>
        )}

        {/* Contenido del análisis */}
        {!isLoading && !errorMessage && analysis && (
          <div className="space-y-4">
            {/* Garantía de protección */}
            <div className="bg-emerald-100 border-2 border-emerald-900 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-950 shrink-0 mt-0.5" />
              <div>
                <span className="text-base font-black text-emerald-950 block">
                  Comida, Transporte y Útiles protegidos
                </span>
                <p className="text-base font-semibold text-emerald-900 leading-snug mt-0.5">
                  La IA no te propone recortar en lo que necesitás para el día a día.
                </p>
              </div>
            </div>

            {/* Diagnóstico */}
            <div className="bg-slate-100 border-2 border-slate-900 rounded-2xl p-4">
              <span className="text-base font-black text-slate-700 uppercase tracking-wide block mb-1">
                Resumen de tu semana
              </span>
              <p className="text-base font-bold text-slate-950 leading-snug">
                {analysis.diagnosis}
              </p>
            </div>

            {/* Propuestas de recorte */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-950 uppercase tracking-wide">
                  Dónde recortar con montos exactos
                </h3>
              </div>

              {analysis.recommendations.length === 0 ? (
                <div className="bg-slate-50 border-2 border-slate-400 rounded-2xl p-4 text-center">
                  <p className="text-base font-bold text-slate-800">
                    No hace falta recortar en tus gastos no esenciales esta semana.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {analysis.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="bg-indigo-50 border-2 border-indigo-900 rounded-2xl p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-base font-black text-indigo-950">
                          {rec.category}
                        </span>
                        <span className="text-base font-black text-indigo-950 bg-white px-2.5 py-1 rounded-xl border border-indigo-900">
                          Bajar {formatCents(rec.cutAmountCents)}
                        </span>
                      </div>

                      <p className="text-lg font-black text-slate-950 leading-snug">
                        {rec.explanation}
                      </p>

                      <div className="flex items-center justify-between text-base font-bold text-slate-700 mt-2 pt-2 border-t border-indigo-200">
                        <span>Gastado: {formatCents(rec.currentSpentCents)}</span>
                        <span>
                          Quedaría: {formatCents(Math.max(0, rec.currentSpentCents - rec.cutAmountCents))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tip de ahorro */}
            {analysis.savingsTip && (
              <div className="bg-amber-100 border-2 border-amber-900 rounded-2xl p-4 flex items-start gap-3">
                <Lightbulb className="w-6 h-6 text-amber-950 shrink-0 mt-0.5" />
                <p className="text-base font-bold text-amber-950 leading-snug">
                  <strong>Consejo práctico:</strong> {analysis.savingsTip}
                </p>
              </div>
            )}

            {/* Único botón principal del modal de análisis */}
            <button
              onClick={onClose}
              className="w-full min-h-[54px] py-3.5 bg-slate-950 hover:bg-slate-900 text-white font-black rounded-2xl text-lg transition-all shadow-md cursor-pointer mt-3 border-2 border-black"
            >
              Entendido, gracias
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
