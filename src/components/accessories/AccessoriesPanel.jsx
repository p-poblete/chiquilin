import React from 'react';
import { ACCESSORIES } from '../../data/assetsMap';

export const AccessoriesPanel = ({ selectedAccessories, onSelectAccessory, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-down bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-amber-100 flex flex-col gap-4 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <h2 className="text-lg font-bold text-slate-800">Accesorios de Chiquilín</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 font-bold text-xl px-2"
          >
            ✕
          </button>
        </div>

        {/* Sombreros / Gorros */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cabeza</h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onSelectAccessory('head', null)}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-xs text-slate-500 ${
                !selectedAccessories.head ? 'border-amber-500 bg-amber-50 font-bold' : 'border-slate-200'
              }`}
            >
              Ninguno
            </button>
            {ACCESSORIES.head.map((acc) => (
              <button
                key={acc.id}
                onClick={() => onSelectAccessory('head', acc)}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                  selectedAccessories.head?.id === acc.id ? 'border-amber-500 bg-amber-50 scale-105 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <img src={acc.image} alt={acc.name} className="w-10 h-10 object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Cuello */}
        <div>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cuello</h3>
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => onSelectAccessory('neck', null)}
              className={`p-2 rounded-xl border flex flex-col items-center justify-center text-xs text-slate-500 ${
                !selectedAccessories.neck ? 'border-amber-500 bg-amber-50 font-bold' : 'border-slate-200'
              }`}
            >
              Ninguno
            </button>
            {ACCESSORIES.neck.map((acc) => (
              <button
                key={acc.id}
                onClick={() => onSelectAccessory('neck', acc)}
                className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                  selectedAccessories.neck?.id === acc.id ? 'border-amber-500 bg-amber-50 scale-105 shadow-sm' : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <img src={acc.image} alt={acc.name} className="w-10 h-10 object-contain" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};