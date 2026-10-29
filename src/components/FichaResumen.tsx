import React, { useState } from 'react';
import { Expediente } from '../types/expediente';
import { 
  CheckCircle2, 
  Copy, 
  Check, 
  Printer, 
  ArrowLeft, 
  FolderPlus, 
  Calendar, 
  User, 
  Briefcase, 
  Hash, 
  ShieldCheck, 
  UserX, 
  FileText, 
  ExternalLink 
} from 'lucide-react';

interface FichaResumenProps {
  expediente: Expediente;
  esRecienCreado?: boolean;
  onVolverALista: () => void;
  onCrearOtro: () => void;
}

export const FichaResumen: React.FC<FichaResumenProps> = ({
  expediente,
  esRecienCreado = false,
  onVolverALista,
  onCrearOtro,
}) => {
  const [copiadoId, setCopiadoId] = useState(false);
  const [copiadoResumen, setCopiadoResumen] = useState(false);

  // Formato legible de fecha y hora en español
  const formatearFecha = (fechaIso: string) => {
    try {
      const fecha = new Date(fechaIso);
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(fecha);
    } catch {
      return fechaIso;
    }
  };

  const handleCopiarId = () => {
    navigator.clipboard.writeText(expediente.id);
    setCopiadoId(true);
    setTimeout(() => setCopiadoId(false), 2000);
  };

  const handleCopiarResumenCompleto = () => {
    const textoResumen = `
========================================
FICHA DE RESUMEN - EXPEDIENTE DIGITAL
========================================
Identificador Interno (UUID): ${expediente.id}
Código de Referencia: ${expediente.codigoInterno}
Estado: ${expediente.estado}
Fecha de Apertura: ${formatearFecha(expediente.fechaApertura)}

DATOS DEL CASO
Título: ${expediente.titulo}
Cliente: ${expediente.cliente}
Materia: ${expediente.materia.toUpperCase()}${expediente.materiaOtra ? ` (${expediente.materiaOtra})` : ''}
Tipo de Asunto: ${expediente.tipoAsunto || 'No especificado'}
Abogado/a Responsable: ${expediente.responsable}

PROCESO JUDICIAL
Número de Proceso Judicial: ${expediente.numeroProceso || 'Pendiente de radicación'}

AUDITORÍA DE CREACIÓN
Creador Registrado: ${expediente.creador.identificador} (${expediente.creador.detalle})

BITÁCORA INICIAL DEL CASO
${expediente.bitacora || 'Sin bitácora inicial registrada.'}
========================================
Generado por IurisExpediente Legaltech
`.trim();

    navigator.clipboard.writeText(textoResumen);
    setCopiadoResumen(true);
    setTimeout(() => setCopiadoResumen(false), 2500);
  };

  const handleImprimir = () => {
    window.print();
  };

  const obtenerEtiquetaMateria = (exp: Expediente) => {
    if (exp.materia === 'otra') {
      return `Otra (${exp.materiaOtra || 'Sin detalle'})`;
    }
    return exp.materia.charAt(0).toUpperCase() + exp.materia.slice(1);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Barra de navegación superior (oculta al imprimir) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <button
          type="button"
          onClick={onVolverALista}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al registro general de expedientes</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopiarResumenCompleto}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Copiar resumen en formato texto plano"
          >
            {copiadoResumen ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Resumen copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copiar ficha de texto</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleImprimir}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Imprimir o exportar como documento PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Imprimir / PDF</span>
          </button>

          <button
            type="button"
            onClick={onCrearOtro}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-2xs cursor-pointer"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>Nuevo expediente</span>
          </button>
        </div>
      </div>

      {/* Banner de Confirmación al crear (Regla 5.1: "mostrar confirmación y ficha de resumen") */}
      {esRecienCreado && (
        <div className="no-print mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-900">
            <h3 className="font-bold">¡Expediente digital creado exitosamente!</h3>
            <p className="text-xs text-emerald-800 mt-0.5">
              Los datos iniciales han sido validados y centralizados bajo un identificador interno único independiente. A continuación se presenta la ficha oficial de resumen.
            </p>
          </div>
        </div>
      )}

      {/* CONTENEDOR DE LA FICHA DE RESUMEN (Apta para pantalla e impresión) */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {/* Cabecera de la Ficha */}
        <div className="p-6 sm:p-8 border-b border-slate-100 bg-linear-to-b from-slate-50/70 to-white">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              {/* Metadatos no encajonados (Zero-Pill discipline) */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="font-medium text-slate-700">Expediente Digital</span>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-700">Estado: {expediente.estado}</span>
                <span aria-hidden="true">·</span>
                <span>Apertura: {formatearFecha(expediente.fechaApertura)}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 leading-tight">
                {expediente.titulo}
              </h1>
            </div>

            {/* Código Interno y UUID */}
            <div className="shrink-0 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left sm:text-right">
              <span className="text-[11px] font-medium text-slate-500 block uppercase tracking-wider">
                Código de Despacho
              </span>
              <span className="text-base font-bold font-mono text-slate-900 block tabular-nums">
                {expediente.codigoInterno}
              </span>
              <div className="mt-1 flex items-center sm:justify-end gap-1.5">
                <span className="text-[11px] font-mono text-slate-500 truncate max-w-[140px] sm:max-w-[170px]" title={expediente.id}>
                  {expediente.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopiarId}
                  className="no-print p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors cursor-pointer"
                  title="Copiar UUID completo"
                >
                  {copiadoId ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Grilla Principal de Datos Estructurados */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Fila 1: Partes Principales */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              1. Partes e Intervinientes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Cliente Patrocinado</span>
                </span>
                <p className="text-base font-bold text-slate-900">
                  {expediente.cliente}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Titular de los derechos o demandante / accionante
                </span>
              </div>

              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  <span>Abogado/a Responsable</span>
                </span>
                <p className="text-base font-bold text-slate-900">
                  {expediente.responsable}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Responsable a cargo del patrocinio y seguimiento
                </span>
              </div>
            </div>
          </div>

          {/* Fila 2: Materia y Proceso Judicial */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              2. Clasificación Jurídica y Proceso Judicial
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Materia</span>
                <p className="text-sm font-bold text-slate-900">
                  {obtenerEtiquetaMateria(expediente)}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Área legal de especialidad
                </span>
              </div>

              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-xs text-slate-500 block mb-1">Tipo de Asunto</span>
                <p className="text-sm font-semibold text-slate-900">
                  {expediente.tipoAsunto || 'No especificado'}
                </p>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Naturaleza específica de la controversia
                </span>
              </div>

              <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg">
                <span className="text-xs text-slate-500 flex items-center gap-1.5 mb-1">
                  <Hash className="w-3.5 h-3.5 text-slate-400" />
                  <span>Número de Proceso Judicial</span>
                </span>
                {expediente.numeroProceso ? (
                  <p className="text-sm font-mono font-bold text-slate-900 tabular-nums">
                    {expediente.numeroProceso}
                  </p>
                ) : (
                  <p className="text-xs font-medium text-slate-500 italic">
                    Sin proceso judicial radicado (Prejudicial / En preparación)
                  </p>
                )}
                <span className="text-[11px] text-slate-500 mt-1 block">
                  {expediente.numeroProceso
                    ? 'Radicación ante juzgado o tribunal'
                    : 'Regla 5.2: Opcional en apertura inicial'}
                </span>
              </div>
            </div>
          </div>

          {/* Fila 3: Bitácora Inicial del Caso */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>3. Bitácora Inicial: Hechos y Antecedentes</span>
            </h2>
            <div className="p-5 bg-slate-50/60 border border-slate-200 rounded-lg">
              {expediente.bitacora ? (
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                  {expediente.bitacora}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No se registró un resumen inicial o bitácora al momento de crear este expediente.
                </p>
              )}
            </div>
          </div>

          {/* Fila 4: Auditoría de Creación y Trazabilidad (Regla 5.2) */}
          <div className="border-t border-slate-100 pt-5">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              4. Trazabilidad y Registro del Creador
            </h2>
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                {expediente.creador.autenticado ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <UserX className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-semibold text-slate-900">
                    {expediente.creador.identificador}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {expediente.creador.detalle}
                  </div>
                </div>
              </div>

              <div className="text-slate-500 text-[11px] sm:text-right">
                <span className="block font-medium text-slate-700">Timestamp de Apertura</span>
                <span className="font-mono tabular-nums">{expediente.fechaApertura}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pie de la Ficha */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Ficha oficial de resumen · IurisExpediente MVP Legaltech 5.1-5.3
          </div>
          <div className="no-print flex items-center gap-3">
            <button
              type="button"
              onClick={onVolverALista}
              className="font-medium text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              Cerrar y volver al listado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
