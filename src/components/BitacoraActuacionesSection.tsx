import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Expediente,
  ActuacionProcesal,
  ActuacionFormData,
  TipoActuacion,
} from '../types/expediente';
import {
  obtenerFechaLocalHoy,
  validarFormularioActuacion,
  crearActuacionProcesal,
  eliminarActuacionProcesal,
  ordenarActuacionesDescendente,
} from '../services/expedienteService';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Plus,
  Trash2,
} from 'lucide-react';

interface BitacoraActuacionesSectionProps {
  expediente: Expediente;
  actuaciones: ActuacionProcesal[];
  onActuacionesActualizadas: (actuacionesExpediente: ActuacionProcesal[]) => void;
}

const TIPOS_ACTUACION: TipoActuacion[] = [
  'Providencia/Auto',
  'Audiencia',
  'Escrito ingresado',
  'Reunión con cliente',
  'Otro',
];

export const BitacoraActuacionesSection: React.FC<BitacoraActuacionesSectionProps> = ({
  expediente,
  actuaciones,
  onActuacionesActualizadas,
}) => {
  const [formData, setFormData] = useState<ActuacionFormData>(() => ({
    fecha: obtenerFechaLocalHoy(),
    tipo: '',
    detalle: '',
  }));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [avisoError, setAvisoError] = useState<string | null>(null);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [filtroTipo, setFiltroTipo] = useState<'todos' | TipoActuacion>('todos');
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);

  const submittingRef = useRef<boolean>(false);

  useEffect(() => {
    setErrores({});
    setAvisoError(null);
    setAvisoExito(null);
    setConfirmandoEliminarId(null);
    setFormData((prev) => ({
      ...prev,
      fecha: prev.fecha || obtenerFechaLocalHoy(),
    }));
  }, [expediente.id]);

  const actuacionesOrdenadas = useMemo(() => {
    const ordenadas = ordenarActuacionesDescendente(actuaciones);
    if (filtroTipo === 'todos') return ordenadas;
    return ordenadas.filter((a) => a.tipo === filtroTipo);
  }, [actuaciones, filtroTipo]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errores[name]) {
      setErrores((prev) => {
        const siguientes = { ...prev };
        delete siguientes[name];
        return siguientes;
      });
    }
    if (avisoError) setAvisoError(null);
    if (avisoExito) setAvisoExito(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingRef.current || guardando) return;

    submittingRef.current = true;
    setGuardando(true);
    setAvisoError(null);
    setAvisoExito(null);

    try {
      const validacion = validarFormularioActuacion(formData);
      if (!validacion.esValido) {
        // Conserva los datos ingresados e indica los campos faltantes
        setErrores(validacion.errores);
        setAvisoError(
          'No se puede guardar la actuación. Complete los campos obligatorios marcados.'
        );
        return;
      }

      // Breve pausa para garantizar botón deshabilitado durante guardado y evitar duplicados
      await new Promise((resolve) => setTimeout(resolve, 100));

      const resultado = crearActuacionProcesal(expediente.id, formData);
      if (resultado.exito && resultado.actuacionesExpediente) {
        onActuacionesActualizadas(resultado.actuacionesExpediente);
        setFormData({
          fecha: obtenerFechaLocalHoy(),
          tipo: '',
          detalle: '',
        });
        setErrores({});
        setAvisoExito(
          resultado.mensaje || 'Actuación registrada en la bitácora del expediente.'
        );
      } else {
        // Si ocurre un error, conserva los datos ingresados y muestra aviso sin perder el texto
        setErrores(resultado.errores || {});
        setAvisoError(
          resultado.mensaje ||
            'Ocurrió un error al guardar la actuación. El texto ingresado se ha conservado.'
        );
      }
    } catch {
      setAvisoError(
        'Error inesperado al guardar la actuación. El texto ingresado se ha conservado.'
      );
    } finally {
      submittingRef.current = false;
      setGuardando(false);
    }
  };

  const handleEliminar = (actuacionId: string) => {
    const resultado = eliminarActuacionProcesal(actuacionId);
    if (resultado.exito && resultado.todasLasActuaciones) {
      const delExpediente = ordenarActuacionesDescendente(
        resultado.todasLasActuaciones.filter((a) => a.expedienteId === expediente.id)
      );
      onActuacionesActualizadas(delExpediente);
      setConfirmandoEliminarId(null);
    }
  };

  const formatearFechaActuacion = (fechaYmd: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(fechaYmd);
    if (!match) return fechaYmd;
    const [, anio, mes, dia] = match;
    const d = new Date(Number(anio), Number(mes) - 1, Number(dia));
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'long',
    }).format(d);
  };

  const formatearHoraRegistro = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('es-ES', {
        timeStyle: 'short',
      }).format(d);
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulario para registrar nueva actuación procesal (HU-03) */}
      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Registrar nueva actuación o novedad
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Toda actuación queda vinculada automáticamente al expediente {expediente.codigoInterno}.
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-500">
            Total registradas: {actuaciones.length}
          </span>
        </div>

        {avisoError && (
          <div
            role="alert"
            className="mb-4 p-3.5 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{avisoError}</p>
              <p className="text-red-700 mt-0.5">
                Los datos escritos se han conservado para que pueda completar la información faltante.
              </p>
            </div>
          </div>
        )}

        {avisoExito && (
          <div
            role="status"
            className="mb-4 p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">{avisoExito}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fecha de la actuación (por defecto fecha actual) */}
            <div>
              <label
                htmlFor="actuacion-fecha"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Fecha de la actuación <span className="text-red-600">*</span>
              </label>
              <input
                type="date"
                id="actuacion-fecha"
                name="fecha"
                value={formData.fecha}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border bg-white text-slate-900 focus:outline-hidden transition-colors ${
                  errores.fecha
                    ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {errores.fecha ? (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errores.fecha}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Toma por defecto la fecha actual; puede ajustarla si registra una actuación previa.
                </p>
              )}
            </div>

            {/* Tipo de actuación */}
            <div>
              <label
                htmlFor="actuacion-tipo"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tipo de actuación <span className="text-red-600">*</span>
              </label>
              <select
                id="actuacion-tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-hidden transition-colors ${
                  errores.tipo
                    ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              >
                <option value="">Seleccione el tipo de actuación...</option>
                {TIPOS_ACTUACION.map((tipo) => (
                  <option key={tipo} value={tipo}>
                    {tipo}
                  </option>
                ))}
              </select>
              {errores.tipo && (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errores.tipo}</span>
                </p>
              )}
            </div>
          </div>

          {/* Detalle / Resumen de la actuación (Obligatorio) */}
          <div>
            <label
              htmlFor="actuacion-detalle"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Detalle / Resumen de la actuación <span className="text-red-600">*</span>
            </label>
            <textarea
              id="actuacion-detalle"
              name="detalle"
              rows={3}
              value={formData.detalle}
              onChange={handleChange}
              placeholder="Describa la providencia notificada, desarrollo de la audiencia, escrito ingresado o acuerdos de reunión con el cliente..."
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-colors ${
                errores.detalle
                  ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
              }`}
            />
            {errores.detalle ? (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errores.detalle}</span>
              </p>
            ) : (
              <div className="flex justify-between items-center text-[11px] text-slate-500 mt-1">
                <span>Campo obligatorio para mantener la trazabilidad cronológica del proceso.</span>
                <span className="font-mono tabular-nums">{formData.detalle.length} caracteres</span>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{guardando ? 'Guardando actuación...' : 'Guardar actuación'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Línea de tiempo / Lista cronológica descendente */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Historial cronológico de actuaciones ({actuacionesOrdenadas.length})
            </h3>
            <p className="text-xs text-slate-500">
              Ordenadas cronológicamente de la más reciente a la más antigua.
            </p>
          </div>

          {/* Filtro rápido por tipo de actuación */}
          {actuaciones.length > 0 && (
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto max-w-full">
              <button
                type="button"
                onClick={() => setFiltroTipo('todos')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  filtroTipo === 'todos'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todas ({actuaciones.length})
              </button>
              {TIPOS_ACTUACION.map((tipo) => {
                const count = actuaciones.filter((a) => a.tipo === tipo).length;
                if (count === 0) return null;
                const activo = filtroTipo === tipo;
                return (
                  <button
                    key={tipo}
                    type="button"
                    onClick={() => setFiltroTipo(tipo)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      activo
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tipo} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {actuacionesOrdenadas.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-8 text-center bg-white">
            <ClipboardList className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">
              {actuaciones.length === 0
                ? 'Aún no se han registrado actuaciones en este expediente'
                : 'No hay actuaciones registradas para este tipo'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {actuaciones.length === 0
                ? 'Registre providencias, audiencias, escritos ingresados o reuniones para construir la cronología del caso.'
                : 'Seleccione otra categoría o visualice todas las actuaciones.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {actuacionesOrdenadas.map((actuacion) => {
              const estaConfirmando = confirmandoEliminarId === actuacion.id;
              return (
                <div
                  key={actuacion.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 transition-colors hover:border-slate-300"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    {/* Columna de fecha y tipo */}
                    <div className="md:w-52 shrink-0 space-y-1">
                      <div className="inline-flex items-center gap-1.5 font-mono tabular-nums text-xs font-semibold text-slate-900">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatearFechaActuacion(actuacion.fecha)}</span>
                      </div>
                      <div className="text-xs font-bold text-slate-800">
                        {actuacion.tipo}
                      </div>
                      {actuacion.fechaCreacion && (
                        <div className="text-[11px] text-slate-400 font-mono tabular-nums">
                          Registro: {formatearHoraRegistro(actuacion.fechaCreacion)}
                        </div>
                      )}
                    </div>

                    {/* Columna de detalle / resumen */}
                    <div className="flex-1 min-w-0 md:border-l md:border-slate-100 md:pl-4">
                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {actuacion.detalle}
                      </p>
                    </div>

                    {/* Acción de eliminación con confirmación en línea */}
                    <div className="shrink-0 self-end md:self-start">
                      {estaConfirmando ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-xs">
                          <span className="text-red-900 font-medium whitespace-nowrap">
                            ¿Eliminar?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEliminar(actuacion.id)}
                            className="px-2 py-0.5 font-semibold text-white bg-red-700 hover:bg-red-800 rounded whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Sí
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmandoEliminarId(null)}
                            className="px-1.5 py-0.5 font-medium text-slate-700 hover:text-slate-900 rounded whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmandoEliminarId(actuacion.id)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          title="Eliminar actuación"
                          aria-label="Eliminar actuación"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
