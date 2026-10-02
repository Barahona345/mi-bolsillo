/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AIAnalysisResponse } from '../types';
import { formatCents } from '../utils/currencyUtils';
import { Sparkles, ShieldCheck, X, AlertCircle, ArrowDownCircle, CheckCircle2 } from 'lucide-react';

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

  const data = analysis?.data;

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
              Propuestas de Ahorro
            </h2>
            <p className="text-base font-semibold text-slate-700">
              Análisis inteligente de gastos
            </p>
          </div>
        </div>

        {/* Estado de carga */}
        {isLoading && (
          <div className="py-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full border-4 border-slate-200 border-t-slate-900 animate-spin mx-auto" />
            <div>
              <p className="font-black text-slate-950 text-lg">Analizando tus números con Gemini...</p>
              <p className="text-base font-semibold text-slate-700 mt-1 max-w-xs mx-auto">
                Verificando que la comida, el transporte y los útiles estén 100% blindados.
              </p>
            </div>
          </div>
        )}

        {/* Mensaje de error / fallo */}
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

        {/* 2. Visualización estructurada como dato (tarjetas / tabla) */}
        {!isLoading && !errorMessage && data && (
          <div className="space-y-4">
            {/* Regla de negocio: Necesarias protegidas */}
            <div className="bg-emerald-100 border-2 border-emerald-900 rounded-2xl p-4 flex items-start gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-950 shrink-0 mt-0.5" />
              <div>
                <span className="text-base font-black text-emerald-950 block">
                  Comida, Transporte y Útiles Intocables
                </span>
                <p className="text-base font-semibold text-emerald-900 leading-snug mt-0.5">
                  La IA tiene prohibido recortar en lo que necesitás para estudiar y vivir el día a día.
                </p>
              </div>
            </div>

            {/* Mensaje corto / Diagnóstico */}
            <div className="bg-slate-100 border-2 border-slate-900 rounded-2xl p-4">
              <span className="text-base font-black text-slate-700 uppercase tracking-wide block mb-1">
                Diagnóstico
              </span>
              <p className="text-base font-bold text-slate-950 leading-snug">
                {data.mensaje_corto}
              </p>
            </div>

            {/* Ahorro Total Detectado */}
            {data.ahorro_total_cents > 0 && (
              <div className="bg-indigo-100 border-2 border-indigo-900 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-base font-black text-indigo-950 block">
                    Ahorro total sugerido:
                  </span>
                  <span className="text-base font-semibold text-indigo-900">
                    En categorías no esenciales
                  </span>
                </div>
                <span className="text-2xl font-black text-indigo-950 bg-white px-3 py-1 rounded-xl border-2 border-indigo-900">
                  {formatCents(data.ahorro_total_cents)}
                </span>
              </div>
            )}

            {/* 2. Lista de Recortes como Datos Estructurados (Tabla / Fichas) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <ArrowDownCircle className="w-5 h-5 text-slate-900" />
                <h3 className="text-base font-black text-slate-950 uppercase tracking-wide">
                  Tabla de recortes sugeridos
                </h3>
              </div>

              {data.recortes.length === 0 ? (
                <div className="bg-slate-50 border-2 border-slate-400 rounded-2xl p-4 text-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
                  <p className="text-base font-bold text-slate-800">
                    No se sugieren recortes en tus gastos no esenciales esta semana.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.recortes.map((item, idx) => (
                    <div
                      key={idx}
                      className="bg-white border-2 border-slate-900 rounded-2xl p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-black text-slate-950">
                          {item.categoria}
                        </span>
                        <span className="text-base font-black text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-300">
                          Ahorro: {formatCents(item.ahorro_cents)}
                        </span>
                      </div>

                      {/* Tabla de cifras cuantitativas */}
                      <div className="grid grid-cols-2 gap-2 my-2 p-2 bg-slate-50 border border-slate-300 rounded-xl text-center">
                        <div>
                          <span className="text-base font-semibold text-slate-600 block">
                            Gasto actual
                          </span>
                          <span className="text-base font-black text-slate-950 block">
                            {formatCents(item.gasto_actual_cents)}
                          </span>
                        </div>
                        <div>
                          <span className="text-base font-semibold text-slate-600 block">
                            Monto sugerido
                          </span>
                          <span className="text-base font-black text-emerald-800 block">
                            {formatCents(item.monto_sugerido_cents)}
                          </span>
                        </div>
                      </div>

                      {/* Motivo de la sugerencia */}
                      <p className="text-base font-semibold text-slate-800 leading-snug mt-2">
                        <strong className="text-slate-950">Motivo:</strong> {item.motivo}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {data.disclaimer && (
              <p className="text-base font-semibold text-slate-600 text-center italic mt-2">
                {data.disclaimer}
              </p>
            )}

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
