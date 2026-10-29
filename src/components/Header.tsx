import React from 'react';
import { Scale, Plus, ShieldCheck, UserX } from 'lucide-react';

interface HeaderProps {
  onNuevoExpediente: () => void;
  sesionAutenticada: boolean;
  onToggleSesion: () => void;
  vistaActual: 'lista' | 'formulario' | 'ficha' | 'guia';
  onCambiarVista: (vista: 'lista' | 'guia') => void;
}

export const Header: React.FC<HeaderProps> = ({
  onNuevoExpediente,
  sesionAutenticada,
  onToggleSesion,
  vistaActual,
  onCambiarVista,
}) => {
  return (
    <header className="border-b border-slate-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-8">
          {/* Zona 1: Wordmark de la marca */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onCambiarVista('lista')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-slate-900 rounded-md"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-xs">
                <Scale className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 block leading-tight">
                  IurisExpediente
                </span>
                <span className="text-[11px] font-medium text-slate-500 block leading-none">
                  Gestión Digital de Casos
                </span>
              </div>
            </button>
          </div>

          {/* Zona 2: Enlaces de navegación concisos */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => onCambiarVista('lista')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                vistaActual === 'lista' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              Registro de Expedientes
            </button>
            <button
              onClick={() => onCambiarVista('guia')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-0.5 ${
                vistaActual === 'guia' ? 'text-slate-900 font-semibold border-b-2 border-slate-900' : ''
              }`}
            >
              Especificaciones MVP 5.1-5.3
            </button>
          </nav>

          {/* Zona 3: Sesión & Acción Principal */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Control interactivo para conmutar sesión y probar regla 5.2 de creador */}
            <button
              type="button"
              onClick={onToggleSesion}
              title={
                sesionAutenticada
                  ? 'Clic para cambiar a modo sin autenticación'
                  : 'Clic para simular sesión autenticada'
              }
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                sesionAutenticada
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {sesionAutenticada ? (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">Sesión Autenticada</span>
                  <span className="text-[10px] text-emerald-600 bg-emerald-100/80 px-1 py-0.2 rounded font-mono">
                    cedric@legal.io
                  </span>
                </>
              ) : (
                <>
                  <UserX className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Sin Autenticación</span>
                  <span className="text-[10px] text-slate-500 bg-slate-200/70 px-1 py-0.2 rounded font-mono">
                    Anónimo
                  </span>
                </>
              )}
            </button>

            {/* Acción Primaria: Nuevo Expediente */}
            <button
              onClick={onNuevoExpediente}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 active:bg-slate-950 transition-colors shadow-xs whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo expediente</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
