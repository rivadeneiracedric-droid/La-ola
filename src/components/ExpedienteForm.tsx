import React, { useState } from 'react';
import { 
  ExpedienteFormData, 
  Materia, 
  Expediente 
} from '../types/expediente';
import { 
  validarFormularioExpediente, 
  crearExpediente 
} from '../services/expedienteService';
import { 
  AlertCircle, 
  FolderPlus, 
  Sparkles, 
  ArrowLeft, 
  Info, 
  Lock, 
  ShieldCheck, 
  UserX, 
  HelpCircle 
} from 'lucide-react';

interface ExpedienteFormProps {
  onExpedienteCreado: (expediente: Expediente) => void;
  onCancelar: () => void;
  sesionAutenticada: boolean;
  usuarioEmail: string;
}

const MATERIAS: { id: Materia; label: string; descripcion: string }[] = [
  { id: 'civil', label: 'Civil', descripcion: 'Contratos, daños, sucesiones, bienes y familia' },
  { id: 'laboral', label: 'Laboral', descripcion: 'Conflictos individuales, despidos y prestaciones' },
  { id: 'penal', label: 'Penal', descripcion: 'Defensa, querellas, medidas cautelares' },
  { id: 'administrativa', label: 'Administrativa', descripcion: 'Sancionatorio, contratación pública y recursos' },
  { id: 'otra', label: 'Otra materia', descripcion: 'Tributario, constitucional, societario, etc.' },
];

export const ExpedienteForm: React.FC<ExpedienteFormProps> = ({
  onExpedienteCreado,
  onCancelar,
  sesionAutenticada,
  usuarioEmail,
}) => {
  // Estado del formulario (se conserva completamente ante cualquier fallo - Regla 5)
  const [formData, setFormData] = useState<ExpedienteFormData>({
    titulo: '',
    cliente: '',
    materia: '',
    materiaOtra: '',
    tipoAsunto: '',
    bitacora: '',
    responsable: '',
    numeroProceso: '',
  });

  const [errores, setErrores] = useState<Record<string, string>>({});
  const [mensajeErrorGlobal, setMensajeErrorGlobal] = useState<string | null>(null);
  const [enviando, setEnviando] = useState<boolean>(false);

  // Manejo de cambios en los inputs
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Limpieza reactiva de error al corregir
    if (errores[name]) {
      setErrores((prev) => {
        const nuevos = { ...prev };
        delete nuevos[name];
        return nuevos;
      });
    }
    if (mensajeErrorGlobal) {
      setMensajeErrorGlobal(null);
    }
  };

  const handleMateriaSelect = (materia: Materia) => {
    setFormData((prev) => ({
      ...prev,
      materia,
      // Si cambia de otra, limpia el campo específico
      materiaOtra: materia === 'otra' ? prev.materiaOtra : '',
    }));

    if (errores.materia) {
      setErrores((prev) => {
        const nuevos = { ...prev };
        delete nuevos.materia;
        return nuevos;
      });
    }
  };

  // Función para rellenar con un ejemplo jurídico típico de prueba
  const cargarEjemploPrueba = () => {
    setFormData({
      titulo: 'Acción ejecutiva por cobro de pagaré a la orden',
      cliente: 'Comercializadora Andina de Alimentos Cía. Ltda.',
      materia: 'civil',
      materiaOtra: '',
      tipoAsunto: 'Juicio ejecutivo mercantil',
      bitacora: 'Cliente entrega pagaré original vencido sin protesto por USD $45,000. Deudor no ha contestado requerimiento de pago. Se alista demanda ejecutiva con solicitud de medida cautelar de retención de cuentas.',
      responsable: 'Abg. Guillermo E. Vintimilla',
      numeroProceso: '', // Opcional, queda en blanco según caso real previo a radicación
    });
    setErrores({});
    setMensajeErrorGlobal(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setMensajeErrorGlobal(null);

    // Validación preliminar
    const validacion = validarFormularioExpediente(formData);
    if (!validacion.esValido) {
      // Regla 5: Los datos ingresados se conservan, se muestran los errores
      setErrores(validacion.errores);
      setMensajeErrorGlobal('No se puede crear el expediente. Por favor corrija los campos obligatorios indicados.');
      setEnviando(false);
      // Desplazar suavemente hacia arriba
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Ejecutar creación del expediente en el servicio
    const sesion = sesionAutenticada
      ? { autenticado: true, email: usuarioEmail }
      : { autenticado: false };

    const resultado = crearExpediente(formData, sesion);

    if (resultado.exito && resultado.expediente) {
      // Éxito: pasar a confirmación y ficha de resumen
      onExpedienteCreado(resultado.expediente);
    } else {
      // Regla 5: Si la creación falla, se conservan los datos escritos y se muestra el error
      setErrores(resultado.errores || {});
      setMensajeErrorGlobal(resultado.mensaje || 'Error inesperado al crear el expediente. Los datos se han conservado.');
      setEnviando(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Botón Volver y Cabecera de la Pantalla */}
      <div className="mb-6">
        <button
          type="button"
          onClick={onCancelar}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors mb-3 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver al listado de expedientes</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Nuevo Expediente Digital
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Registro y centralización de la información inicial del caso jurídico.
            </p>
          </div>

          <button
            type="button"
            onClick={cargarEjemploPrueba}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors self-start sm:self-auto cursor-pointer"
            title="Carga un caso de ejemplo con datos reales para probar rápidamente"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Cargar datos de ejemplo</span>
          </button>
        </div>
      </div>

      {/* Banner de Error Global si la validación o guardado falla (Regla 5) */}
      {mensajeErrorGlobal && (
        <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-semibold">{mensajeErrorGlobal}</p>
            <p className="text-xs text-red-700 mt-1">
              Tus datos escritos se han mantenido intactos en el formulario. Por favor revisa los campos en rojo.
            </p>
          </div>
        </div>
      )}

      {/* Formulario Principal */}
      <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* SECCIÓN 1: Identificación y Automatización (Regla 5.2 - UUID & Contador) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>1. Parámetros del Sistema (Automáticos)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Identificador Interno Único (Regla 3 & 5.2) */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700">Identificador Interno</span>
                <span className="text-[11px] text-slate-400 font-mono">UUID v4</span>
              </div>
              <p className="text-xs font-mono font-medium text-slate-900 truncate">
                Se generará automáticamente al guardar
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Identificador único independiente, sin contador manual ni confusión con el número judicial.
              </p>
            </div>

            {/* Estado Inicial (Regla 5.2) */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700">Estado Inicial</span>
                <span className="text-[11px] text-emerald-700 font-medium bg-emerald-100/70 px-1.5 py-0.2 rounded">
                  Fijo inicial
                </span>
              </div>
              <p className="text-sm font-semibold text-emerald-800">
                Abierto
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                Valor inicial predeterminado. No se implementan todavía cambios de estado en este MVP.
              </p>
            </div>

            {/* Creador del Expediente (Regla 5.2) */}
            <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-medium text-slate-700">Creador Registrado</span>
                {sesionAutenticada ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <UserX className="w-3.5 h-3.5 text-slate-400" />
                )}
              </div>
              <p className="text-xs font-medium text-slate-900 truncate">
                {sesionAutenticada ? usuarioEmail : 'Sin autenticación'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {sesionAutenticada
                  ? 'Registrado con la sesión verificada del usuario actual.'
                  : 'Sin inventar identidad ni confundirlo con el abogado responsable.'}
              </p>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: Datos Básicos del Caso Jurídico */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              2. Datos Obligatorios del Caso
            </h2>
            <span className="text-xs text-slate-500">
              Los campos con <span className="text-red-500 font-semibold">*</span> son obligatorios
            </span>
          </div>

          {/* Nombre o título del caso (Obligatorio - Regla 1) */}
          <div>
            <label htmlFor="titulo" className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre o título del caso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="titulo"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              placeholder="Ej: Demanda por rescisión de contrato de compraventa mercantil"
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-colors ${
                errores.titulo
                  ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                  : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
              }`}
            />
            {errores.titulo ? (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errores.titulo}</span>
              </p>
            ) : (
              <p className="mt-1 text-[11px] text-slate-500">
                Texto breve y descriptivo que permita reconocer rápidamente el asunto en el despacho.
              </p>
            )}
          </div>

          {/* Cliente (Obligatorio - Regla 1) & Responsable (Obligatorio - Regla 1) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="cliente" className="block text-xs font-semibold text-slate-700 mb-1">
                Cliente <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cliente"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Ej: Inversiones Los Andes S.A. o Juan Pérez"
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-colors ${
                  errores.cliente
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {errores.cliente ? (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errores.cliente}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Nombre de la persona natural o jurídica representada.
                </p>
              )}
            </div>

            <div>
              <label htmlFor="responsable" className="block text-xs font-semibold text-slate-700 mb-1">
                Abogado/a Responsable <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="responsable"
                name="responsable"
                value={formData.responsable}
                onChange={handleChange}
                placeholder="Ej: Dra. Carmen Morales Rivera"
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-colors ${
                  errores.responsable
                    ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-400'
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {errores.responsable ? (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errores.responsable}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Profesional a cargo del patrocinio o tramitación del caso.
                </p>
              )}
            </div>
          </div>

          {/* Materia (Obligatorio - Regla 1 & 5.2: Civil, Laboral, Penal, Administrativa u Otra) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700">
                Materia jurídica <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-500">
                Seleccione el ámbito legal inicial
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {MATERIAS.map((item) => {
                const seleccionado = formData.materia === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleMateriaSelect(item.id)}
                    className={`text-left p-3 rounded-lg border transition-all text-xs cursor-pointer ${
                      seleccionado
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="font-semibold block">{item.label}</div>
                    <div
                      className={`text-[10px] mt-1 leading-snug line-clamp-2 ${
                        seleccionado ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      {item.descripcion}
                    </div>
                  </button>
                );
              })}
            </div>

            {errores.materia && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errores.materia}</span>
              </p>
            )}

            {/* Campo condicional si la materia es "otra" */}
            {formData.materia === 'otra' && (
              <div className="mt-3 p-3 bg-amber-50/70 border border-amber-200 rounded-lg">
                <label htmlFor="materiaOtra" className="block text-xs font-semibold text-amber-900 mb-1">
                  Especifique la otra materia <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="materiaOtra"
                  name="materiaOtra"
                  value={formData.materiaOtra}
                  onChange={handleChange}
                  placeholder="Ej: Derecho Tributario / Aduanero / Arbitraje Comercial"
                  className={`w-full px-3 py-2 text-xs rounded-md border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden ${
                    errores.materiaOtra
                      ? 'border-red-400 focus:border-red-500'
                      : 'border-amber-300 focus:border-slate-900'
                  }`}
                />
                {errores.materiaOtra && (
                  <p className="mt-1 text-xs text-red-600">{errores.materiaOtra}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECCIÓN 3: Datos Complementarios (Proceso Judicial & Tipo de Asunto) */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              3. Datos Complementarios y Judiciales
            </h2>
            <span className="text-xs text-slate-500">Campos opcionales</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Número de proceso judicial (Opcional - Regla 4 & 5.2) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="numeroProceso" className="block text-xs font-semibold text-slate-700">
                  Número de proceso judicial
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  Opcional (Regla 4)
                </span>
              </div>
              <input
                type="text"
                id="numeroProceso"
                name="numeroProceso"
                value={formData.numeroProceso}
                onChange={handleChange}
                placeholder="Ej: 17230-2026-00481 (o dejar vacío)"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 font-mono transition-colors"
              />
              <p className="mt-1 text-[11px] text-slate-500 flex items-start gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>
                  Puede dejarse vacío si todavía no existe un proceso judicial radicado. No se confunde con el ID interno.
                </span>
              </p>
            </div>

            {/* Tipo de asunto (Opcional - Regla 5.2) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="tipoAsunto" className="block text-xs font-semibold text-slate-700">
                  Tipo de asunto
                </label>
                <span className="text-[11px] font-medium text-slate-500">
                  Opcional
                </span>
              </div>
              <input
                type="text"
                id="tipoAsunto"
                name="tipoAsunto"
                value={formData.tipoAsunto}
                onChange={handleChange}
                placeholder="Ej: Reclamación indemnizatoria, amparo o prescripción adquisitiva"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
              />
              <p className="mt-1 text-[11px] text-slate-500">
                Texto breve para precisar la naturaleza específica del caso sin catálogo cerrado.
              </p>
            </div>
          </div>

          {/* Bitácora / Resumen inicial del caso (Regla 5.2) */}
          <div>
            <label htmlFor="bitacora" className="block text-xs font-semibold text-slate-700 mb-1">
              Bitácora: Resumen inicial del caso
            </label>
            <textarea
              id="bitacora"
              name="bitacora"
              rows={4}
              value={formData.bitacora}
              onChange={handleChange}
              placeholder="Registre aquí los antecedentes esenciales recibidos del cliente, fechas clave, documentos aportados y estrategia preliminar acordada..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 transition-colors"
            />
            <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
              <span>Notas iniciales de contexto registradas por el usuario al abrir el expediente.</span>
              <span>{formData.bitacora.length} caracteres</span>
            </div>
          </div>
        </div>

        {/* Acciones del formulario */}
        <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onCancelar}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="submit"
            disabled={enviando}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <FolderPlus className="w-4 h-4" />
            <span>Validar y crear expediente</span>
          </button>
        </div>
      </form>
    </div>
  );
};
