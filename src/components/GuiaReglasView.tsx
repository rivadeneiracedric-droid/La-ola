import React from 'react';
import { CheckCircle2, Scale, ArrowLeft, ShieldCheck, Lock, FileText, Check } from 'lucide-react';

interface GuiaReglasViewProps {
  onVolver: () => void;
  onNuevoExpediente: () => void;
}

export const GuiaReglasView: React.FC<GuiaReglasViewProps> = ({ onVolver, onNuevoExpediente }) => {
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
          Especificaciones de la Historia de Usuario: MVP Legaltech
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Verificación de cumplimiento de los alcances 5.1, 5.2 y 5.3 para la creación del expediente digital.
        </p>
      </div>

      {/* 5.1 Alcance */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
          <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-mono text-xs">
            5.1
          </span>
          <span>Alcance y Flujo de la Historia</span>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          <strong>Flujo implementado:</strong> Nuevo expediente → completar formulario → validar reglas de negocio → crear expediente → mostrar confirmación y ficha de resumen estructurada.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">1. Formulario</span>
            <span className="text-slate-500 text-[11px]">Campos requeridos y complementarios ordenados.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">2. Validación</span>
            <span className="text-slate-500 text-[11px]">En tiempo real y al enviar, sin pérdida de datos.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">3. Creación</span>
            <span className="text-slate-500 text-[11px]">Genera UUID y timestamp de apertura inmutable.</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="font-semibold text-slate-900 block">4. Ficha Resumen</span>
            <span className="text-slate-500 text-[11px]">Vista oficial con exportación a PDF y portapapeles.</span>
          </div>
        </div>
      </div>

      {/* 5.2 Campos y Reglas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
          <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-mono text-xs">
            5.2
          </span>
          <span>Campos del Expediente y Reglas de Negocio</span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Identificador interno</div>
            <div className="text-slate-600 sm:w-2/3">
              Generado automáticamente mediante UUID v4 independiente. No depende de contadores manuales ni se expone a edición del usuario.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Número de proceso judicial</div>
            <div className="text-slate-600 sm:w-2/3">
              Opcional. Puede quedar vacío si todavía no existe un proceso judicial (trámites extrajudiciales o en elaboración).
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Nombre o título del caso</div>
            <div className="text-slate-600 sm:w-2/3">
              Obligatorio. Texto breve que permite reconocer el asunto de inmediato.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Cliente</div>
            <div className="text-slate-600 sm:w-2/3">
              Obligatorio. Nombre ingresado directamente como texto, sin construir aún módulo independiente de clientes.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Materia</div>
            <div className="text-slate-600 sm:w-2/3">
              Obligatoria. Selección entre: <code>Civil</code>, <code>Laboral</code>, <code>Penal</code>, <code>Administrativa</code> u <code>Otra</code> (con campo de texto complementario si se elige Otra).
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Tipo de asunto</div>
            <div className="text-slate-600 sm:w-2/3">
              Opcional. Texto breve para precisar la naturaleza del caso sin requerir catálogo cerrado.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Bitácora inicial</div>
            <div className="text-slate-600 sm:w-2/3">
              Resumen inicial de hechos, antecedentes y primeras instrucciones, ingresado por el usuario.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Responsable</div>
            <div className="text-slate-600 sm:w-2/3">
              Obligatorio. Se ingresa en el formulario sin precargar nombres ni requerir módulo de gestión de usuarios.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Estado</div>
            <div className="text-slate-600 sm:w-2/3">
              Valor inicial inmutable en este MVP: <strong>Abierto</strong>.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Fecha de apertura</div>
            <div className="text-slate-600 sm:w-2/3">
              Se registra automáticamente con timestamp exacto en el momento de crear el expediente.
            </div>
          </div>

          <div className="py-2.5 flex flex-col sm:flex-row sm:items-start justify-between gap-1">
            <div className="font-semibold text-slate-900 sm:w-1/3">Creador</div>
            <div className="text-slate-600 sm:w-2/3">
              Se registra a partir de la sesión autenticada cuando exista. <em>Sin autenticación, no se inventa una identidad ni se presenta al responsable como creador verificado.</em> (Probable mediante el conmutador en la barra superior).
            </div>
          </div>
        </div>
      </div>

      {/* 5.3 Reglas Estrictas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-2xs space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
          <span className="w-6 h-6 rounded-md bg-slate-900 text-white flex items-center justify-center font-mono text-xs">
            5.3
          </span>
          <span>Reglas de Validación Estricta</span>
        </div>

        <ul className="space-y-2 text-xs text-slate-700">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Regla 1:</strong> No se puede crear un expediente sin título, cliente, materia y responsable.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Regla 2:</strong> Los campos de texto obligatorios deben completarse (no se admiten solo espacios en blanco).</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Regla 3:</strong> El identificador interno no se introduce manualmente ni se confunde con el número judicial.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Regla 4:</strong> El número de proceso judicial externo es opcional.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span><strong>Regla 5:</strong> Si la creación falla o hay campos incompletos, se conservan exactamente todos los datos escritos y se muestra el error claramente.</span>
          </li>
        </ul>

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
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
