import React from 'react';
import { CheckCircle2, ArrowLeft } from 'lucide-react';

interface GuiaReglasViewProps {
  onVolver: () => void;
  onNuevoExpediente: () => void;
}

export const GuiaReglasView: React.FC<GuiaReglasViewProps> = ({
  onVolver,
  onNuevoExpediente,
}) => {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-6">
      <button
        type="button"
        onClick={onVolver}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Volver al registro de expedientes</span>
      </button>

      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Especificaciones Funcionales: EXP-Legal (La Ola)
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Alcance y reglas de negocio implementadas para HU-01, HU-02 y HU-03.
        </p>
      </div>

      {/* HU-01 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
          <span className="px-2 py-1 rounded-md bg-slate-900 text-white font-mono text-xs">
            HU-01
          </span>
          <span>Creación y Centralización de Expediente Digital</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Registro inicial del caso jurídico con identificador interno único UUID v4 independiente del número judicial, validación obligatoria de título, cliente, materia y responsable, estado inicial <strong>Abierto</strong>, fecha de apertura automática y trazabilidad del creador según la sesión.
        </p>
      </div>

      {/* HU-02 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
          <span className="px-2 py-1 rounded-md bg-slate-900 text-white font-mono text-xs">
            HU-02
          </span>
          <span>Control de Plazos Procesales para Escritos y Pruebas</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Tipos de plazo y fases del proceso:</strong> Conserva las opciones generales (<em>Presentación de escritos, Anuncio/Práctica de prueba, Recurso/Apelación, Contestación, Otro</em>) e incorpora las fases según el tipo de proceso: en <strong>Proceso Penal</strong> (<em>Investigación previa, Formulación de cargos, Instrucción fiscal, Audiencia preparatoria de juicio, Audiencia de juicio</em>) y en <strong>Proceso Ordinario / Sumario</strong> (<em>Presentar la demanda, Notificaciones para completar actuaciones, Citación, Contestación a la demanda, Audiencia preliminar / Audiencia única, Audiencia de juicio</em>, entre otras).
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Validación de fecha límite:</strong> Obligatoria y siempre igual o posterior a la fecha de apertura del expediente.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Ordenamiento y alertas:</strong> Ordenados desde el vencimiento más cercano al más lejano; los plazos en estado <em>Pendiente</em> cuya fecha sea menor o igual a la actual se destacan en color rojo con alerta explícita.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Actualización de estado:</strong> Cambio directo de <em>Pendiente</em> a <em>Presentado/Cumplido</em> dentro de la ficha del expediente.
            </span>
          </li>
        </ul>
      </div>

      {/* HU-03 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
          <span className="px-2 py-1 rounded-md bg-slate-900 text-white font-mono text-xs">
            HU-03
          </span>
          <span>Bitácora de Actuaciones y Novedades del Caso</span>
        </div>
        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Datos de la actuación:</strong> Fecha obligatoria (toma por defecto la fecha actual), tipo (Providencia/Auto, Audiencia, Escrito ingresado, Reunión con cliente, Otro) y detalle obligatorio.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Vinculación y cronología:</strong> Toda actuación queda vinculada automáticamente al expediente activo y se despliega ordenada de la más reciente a la más antigua.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Protección contra duplicados y errores:</strong> Deshabilitación del botón durante el guardado y conservación íntegra de los datos escritos ante cualquier error de validación.
            </span>
          </li>
        </ul>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onNuevoExpediente}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <span>Crear nuevo expediente ahora</span>
          </button>
        </div>
      </div>
    </div>
  );
};
