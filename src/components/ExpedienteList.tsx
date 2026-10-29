import React, { useState, useMemo } from 'react';
import { Expediente, Materia } from '../types/expediente';
import { 
  Search, 
  FolderPlus, 
  Filter, 
  FileText, 
  Calendar, 
  User, 
  Briefcase, 
  Hash, 
  ChevronRight, 
  Scale, 
  AlertCircle 
} from 'lucide-react';

interface ExpedienteListProps {
  expedientes: Expediente[];
  onSeleccionarExpediente: (expediente: Expediente) => void;
  onNuevoExpediente: () => void;
}

export const ExpedienteList: React.FC<ExpedienteListProps> = ({
  expedientes,
  onSeleccionarExpediente,
  onNuevoExpediente,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [filtroMateria, setFiltroMateria] = useState<string>('todas');

  // Filtrado reactivo en tiempo real
  const expedientesFiltrados = useMemo(() => {
    return expedientes.filter((exp) => {
      const matchMateria =
        filtroMateria === 'todas' || exp.materia === filtroMateria;

      if (!matchMateria) return false;

      if (!busqueda.trim()) return true;

      const q = busqueda.toLowerCase().trim();
      return (
        exp.titulo.toLowerCase().includes(q) ||
        exp.cliente.toLowerCase().includes(q) ||
        exp.responsable.toLowerCase().includes(q) ||
        (exp.numeroProceso && exp.numeroProceso.toLowerCase().includes(q)) ||
        exp.codigoInterno.toLowerCase().includes(q) ||
        exp.id.toLowerCase().includes(q)
      );
    });
  }, [expedientes, busqueda, filtroMateria]);

  // Formato breve de fecha
  const formatearFechaCorta = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(d);
    } catch {
      return iso;
    }
  };

  const getBadgeMateria = (materia: Materia) => {
    switch (materia) {
      case 'civil':
        return 'text-sky-700 bg-sky-50 border-sky-200';
      case 'laboral':
        return 'text-indigo-700 bg-indigo-50 border-indigo-200';
      case 'penal':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'administrativa':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'otra':
      default:
        return 'text-slate-700 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Cabecera y Resumen de la Carpeta General */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Expedientes Digitales Centralizados
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Registro inicial, control de apertura y trazabilidad para el despacho jurídico.
          </p>
        </div>

        <button
          onClick={onNuevoExpediente}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Nuevo expediente</span>
        </button>
      </div>

      {/* Métricas sobrias de un vistazo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Total Expedientes</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
            {expedientes.length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Registrados en despacho</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Estado Abierto</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700 mt-1 block">
            {expedientes.filter((e) => e.estado === 'Abierto').length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">100% activos en trámite</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Con Proceso Judicial</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
            {expedientes.filter((e) => Boolean(e.numeroProceso)).length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Radicados ante tribunales</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 block">Prejudiciales / Apertura</span>
          <span className="text-2xl font-bold font-mono tabular-nums text-amber-700 mt-1 block">
            {expedientes.filter((e) => !e.numeroProceso).length}
          </span>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Sin proceso externo aún</span>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Input de Búsqueda */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por título, cliente, abogado, número judicial o código..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 bg-white placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            />
          </div>

          {/* Segmented controls para materias */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'todas', label: 'Todas' },
              { id: 'civil', label: 'Civil' },
              { id: 'laboral', label: 'Laboral' },
              { id: 'penal', label: 'Penal' },
              { id: 'administrativa', label: 'Administrativa' },
              { id: 'otra', label: 'Otra' },
            ].map((tab) => {
              const activo = filtroMateria === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFiltroMateria(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors cursor-pointer ${
                    activo
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Indicador de resultados activos */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Mostrando <strong className="font-semibold text-slate-700">{expedientesFiltrados.length}</strong> de{' '}
            {expedientes.length} expedientes
          </span>
          {busqueda && (
            <button
              onClick={() => setBusqueda('')}
              className="text-xs text-slate-500 hover:text-slate-900 underline cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          )}
        </div>
      </div>

      {/* Lista de Expedientes */}
      {expedientesFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-2xs">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <Scale className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">
            No se encontraron expedientes
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {busqueda || filtroMateria !== 'todas'
              ? 'Prueba modificando tus términos de búsqueda o cambiando el filtro de materia.'
              : 'Aún no has registrado ningún expediente digital. Comienza creando el primero ahora mismo.'}
          </p>
          <div className="mt-5">
            <button
              onClick={onNuevoExpediente}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs cursor-pointer"
            >
              <FolderPlus className="w-4 h-4" />
              <span>Crear expediente</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {expedientesFiltrados.map((exp) => (
            <div
              key={exp.id}
              onClick={() => onSeleccionarExpediente(exp)}
              className="group bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-5 transition-all shadow-2xs hover:shadow-xs cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Metadatos superiores */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <span className="font-mono font-semibold text-slate-900 text-xs">
                      {exp.codigoInterno}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize font-medium text-slate-700">
                      {exp.materia === 'otra' ? `Otra (${exp.materiaOtra || 'Esp.'})` : exp.materia}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="text-emerald-700 font-medium">
                      {exp.estado}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>Apertura {formatearFechaCorta(exp.fechaApertura)}</span>
                  </div>

                  {/* Título */}
                  <h3 className="text-base font-bold text-slate-900 group-hover:text-slate-800 transition-colors truncate">
                    {exp.titulo}
                  </h3>

                  {/* Partes */}
                  <div className="mt-2.5 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>Cliente:</span>
                      <strong className="font-semibold text-slate-800">{exp.cliente}</strong>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                      <span>Responsable:</span>
                      <span className="text-slate-800">{exp.responsable}</span>
                    </div>

                    {exp.numeroProceso ? (
                      <div className="flex items-center gap-1.5">
                        <Hash className="w-3.5 h-3.5 text-slate-400" />
                        <span>Proc. Judicial:</span>
                        <span className="font-mono font-medium text-slate-800 tabular-nums">
                          {exp.numeroProceso}
                        </span>
                      </div>
                    ) : (
                      <div className="text-slate-400 italic">
                        (Sin número judicial asignado)
                      </div>
                    )}
                  </div>
                </div>

                {/* Acción para abrir ficha */}
                <div className="shrink-0 flex items-center gap-2 sm:self-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <span className="text-xs font-medium text-slate-500 group-hover:text-slate-900 transition-colors flex items-center gap-1">
                    Ver ficha de resumen
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 group-hover:translate-x-0.5 transition-all" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
