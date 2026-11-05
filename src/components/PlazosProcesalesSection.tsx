import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Expediente,
  PlazoProcesal,
  PlazoFormData,
  TipoPlazo,
  EstadoPlazo,
  TipoProcedimiento,
} from '../types/expediente';
import {
  TIPOS_PLAZO_GENERALES,
  obtenerProcedimientoPorDefectoExpediente,
  obtenerFasesPorProcedimiento,
  etiquetaProcedimiento,
  validarFormularioPlazo,
  crearPlazoProcesalAsync,
  actualizarEstadoPlazoAsync,
  eliminarPlazoProcesalAsync,
  esPlazoVencido,
  ordenarPlazosCronologicamente,
  formatearFechaHoraLocalParaInput,
} from '../services/expedienteService';
import {
  AlertCircle,
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Plus,
  RotateCcw,
  Trash2,
} from 'lucide-react';

interface PlazosProcesalesSectionProps {
  expediente: Expediente;
  plazos: PlazoProcesal[];
  onPlazosActualizados: (plazosExpediente: PlazoProcesal[]) => void;
  onActualizarTipoProceso?: (tipoProceso: TipoProcedimiento) => void;
}

export const PlazosProcesalesSection: React.FC<PlazosProcesalesSectionProps> = ({
  expediente,
  plazos,
  onPlazosActualizados,
  onActualizarTipoProceso,
}) => {
  const esCasoPenal = expediente.materia === 'penal';

  const [procedimientoActivo, setProcedimientoActivo] = useState<TipoProcedimiento>(() =>
    obtenerProcedimientoPorDefectoExpediente(expediente)
  );

  const [formData, setFormData] = useState<PlazoFormData>({
    tipo: '',
    fechaLimite: '',
    descripcion: '',
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [avisoError, setAvisoError] = useState<string | null>(null);
  const [avisoExito, setAvisoExito] = useState<string | null>(null);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [filtroEstado, setFiltroEstado] = useState<'todos' | EstadoPlazo>('todos');
  const [confirmandoEliminarId, setConfirmandoEliminarId] = useState<string | null>(null);
  const [ahoraMs, setAhoraMs] = useState<number>(() => Date.now());

  const submittingRef = useRef<boolean>(false);

  // Actualiza la referencia temporal cada 15 segundos para destacar plazos que venzan en tiempo real
  useEffect(() => {
    const intervalo = window.setInterval(() => {
      setAhoraMs(Date.now());
    }, 15000);
    return () => window.clearInterval(intervalo);
  }, []);

  // Sincroniza el procedimiento activo y limpia avisos al cambiar de expediente
  useEffect(() => {
    setProcedimientoActivo(obtenerProcedimientoPorDefectoExpediente(expediente));
    setErrores({});
    setAvisoError(null);
    setAvisoExito(null);
    setConfirmandoEliminarId(null);
  }, [expediente.id, expediente.materia, expediente.tipoProceso]);

  const fasesDelProcedimiento = useMemo(
    () => obtenerFasesPorProcedimiento(procedimientoActivo),
    [procedimientoActivo]
  );

  const tituloGrupoFases = useMemo(() => {
    switch (procedimientoActivo) {
      case 'penal':
        return 'Etapas del proceso penal';
      case 'sumario':
        return 'Fases del proceso sumario';
      case 'ordinario':
      default:
        return 'Fases del proceso ordinario';
    }
  }, [procedimientoActivo]);

  const handleSeleccionarProcedimiento = (nuevoProc: TipoProcedimiento) => {
    if (esCasoPenal) return;
    setProcedimientoActivo(nuevoProc);
    onActualizarTipoProceso?.(nuevoProc);

    // Si la fase seleccionada no existe en el nuevo procedimiento ni en las opciones generales, limpiar selección
    const nuevasFases = obtenerFasesPorProcedimiento(nuevoProc);
    const opcionesValidas: TipoPlazo[] = [...TIPOS_PLAZO_GENERALES, ...nuevasFases];
    if (formData.tipo && !opcionesValidas.includes(formData.tipo as TipoPlazo)) {
      setFormData((prev) => ({ ...prev, tipo: '' }));
    }
  };

  const plazosOrdenados = useMemo(() => {
    const ordenados = ordenarPlazosCronologicamente(plazos);
    if (filtroEstado === 'todos') return ordenados;
    return ordenados.filter((p) => p.estado === filtroEstado);
  }, [plazos, filtroEstado]);

  const totalPendientes = useMemo(
    () => plazos.filter((p) => p.estado === 'Pendiente').length,
    [plazos]
  );

  const totalVencidos = useMemo(
    () => plazos.filter((p) => esPlazoVencido(p, ahoraMs)).length,
    [plazos, ahoraMs]
  );

  const totalCumplidos = useMemo(
    () => plazos.filter((p) => p.estado === 'Presentado/Cumplido').length,
    [plazos]
  );

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
      const payload: PlazoFormData = {
        ...formData,
        procedimiento: procedimientoActivo,
      };

      const validacion = validarFormularioPlazo(payload, expediente.fechaApertura);
      if (!validacion.esValido) {
        // Conserva los datos ingresados y muestra los errores
        setErrores(validacion.errores);
        setAvisoError(
          'No se puede guardar el plazo procesal. Revise los campos obligatorios y las reglas de validación.'
        );
        return;
      }

      // Pequeña pausa de confirmación para asegurar estado deshabilitado visible y evitar envíos duplicados
      await new Promise((resolve) => setTimeout(resolve, 100));

      const resultado = await crearPlazoProcesalAsync(expediente, payload);
      if (resultado.exito && resultado.plazosExpediente) {
        onPlazosActualizados(resultado.plazosExpediente);
        setFormData({
          tipo: '',
          fechaLimite: '',
          descripcion: '',
        });
        setErrores({});
        setAvisoExito(resultado.mensaje || 'Plazo procesal registrado correctamente.');
        setAhoraMs(Date.now());
      } else {
        // Si falla, conserva exactamente los datos ingresados y muestra el error
        setErrores(resultado.errores || {});
        setAvisoError(
          resultado.mensaje ||
            'Ocurrió un error al registrar el plazo procesal. Los datos ingresados se han conservado.'
        );
      }
    } catch {
      setAvisoError(
        'Error inesperado al guardar el plazo procesal. Los datos ingresados se han conservado.'
      );
    } finally {
      submittingRef.current = false;
      setGuardando(false);
    }
  };

  const handleCambiarEstado = async (plazoId: string, nuevoEstado: EstadoPlazo) => {
    const resultado = await actualizarEstadoPlazoAsync(plazoId, nuevoEstado);
    if (resultado.exito && resultado.plazo) {
      const delExpediente = ordenarPlazosCronologicamente(
        plazos.map((p) => (p.id === plazoId ? resultado.plazo! : p))
      );
      onPlazosActualizados(delExpediente);
      setAhoraMs(Date.now());
    } else if (resultado.mensaje) {
      setAvisoError(resultado.mensaje);
    }
  };

  const handleEliminar = async (plazoId: string) => {
    const resultado = await eliminarPlazoProcesalAsync(plazoId);
    if (resultado.exito) {
      const delExpediente = ordenarPlazosCronologicamente(
        plazos.filter((p) => p.id !== plazoId)
      );
      onPlazosActualizados(delExpediente);
      setConfirmandoEliminarId(null);
    } else if (resultado.mensaje) {
      setAvisoError(resultado.mensaje);
    }
  };

  const formatearFechaHora = (iso: string) => {
    try {
      const fecha = new Date(iso);
      return new Intl.DateTimeFormat('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(fecha);
    } catch {
      return iso;
    }
  };

  const minFechaHoraApertura = formatearFechaHoraLocalParaInput(expediente.fechaApertura);

  return (
    <div className="space-y-6">
      {/* Resumen numérico tabulado de plazos del expediente */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg">
          <span className="text-xs font-medium text-slate-500 block">Plazos Pendientes</span>
          <span className="text-xl font-bold font-mono tabular-nums text-slate-900 mt-1 block">
            {totalPendientes}
          </span>
        </div>

        <div
          className={`p-4 border rounded-lg ${
            totalVencidos > 0
              ? 'bg-red-50/80 border-red-300'
              : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <span
            className={`text-xs font-medium block ${
              totalVencidos > 0 ? 'text-red-800' : 'text-slate-500'
            }`}
          >
            Vencidos sin presentar
          </span>
          <span
            className={`text-xl font-bold font-mono tabular-nums mt-1 block ${
              totalVencidos > 0 ? 'text-red-700' : 'text-slate-900'
            }`}
          >
            {totalVencidos}
          </span>
        </div>

        <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-lg">
          <span className="text-xs font-medium text-slate-500 block">Presentados / Cumplidos</span>
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-700 mt-1 block">
            {totalCumplidos}
          </span>
        </div>
      </div>

      {/* Formulario para registrar nuevo plazo procesal (HU-02) */}
      <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-4 border-b border-slate-200/80">
          <div>
            <h2 className="text-sm font-bold text-slate-900">
              Registrar nuevo plazo procesal
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle fechas límite de escritos, pruebas, recursos y fases del proceso.
            </p>
          </div>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            Apertura del caso: {formatearFechaHora(expediente.fechaApertura)}
          </span>
        </div>

        {/* Selector de tipo de proceso (Penal automático o Ordinario / Sumario para materias no penales) */}
        <div className="mb-4 pb-4 border-b border-slate-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-slate-800 block">
              Fases según tipo de proceso
            </span>
            <span className="text-[11px] text-slate-500 block">
              {esCasoPenal
                ? 'Caso en materia penal: etapas del proceso penal habilitadas automáticamente.'
                : 'Seleccione si el trámite es Ordinario o Sumario para desplegar sus fases procesales.'}
            </span>
          </div>

          {esCasoPenal ? (
            <div className="inline-flex items-center px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shrink-0 self-start sm:self-auto">
              Proceso Penal
            </div>
          ) : (
            <div
              role="group"
              aria-label="Seleccionar tipo de proceso"
              className="inline-flex items-center gap-1 p-1 bg-slate-200/70 rounded-lg self-start sm:self-auto"
            >
              {(
                [
                  { id: 'ordinario', label: 'Proceso Ordinario' },
                  { id: 'sumario', label: 'Proceso Sumario' },
                ] as const
              ).map((proc) => {
                const activo = procedimientoActivo === proc.id;
                return (
                  <button
                    key={proc.id}
                    type="button"
                    onClick={() => handleSeleccionarProcedimiento(proc.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      activo
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    {proc.label}
                  </button>
                );
              })}
            </div>
          )}
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
                Los datos ingresados se mantienen en el formulario para que pueda corregirlos.
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
            {/* Tipo de plazo / Fase del proceso */}
            <div>
              <label
                htmlFor="plazo-tipo"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Tipo de plazo / Fase del proceso <span className="text-red-600">*</span>
              </label>
              <select
                id="plazo-tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 focus:outline-hidden transition-colors ${
                  errores.tipo
                    ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              >
                <option value="">Seleccione un tipo de plazo o fase...</option>
                <optgroup label={tituloGrupoFases}>
                  {fasesDelProcedimiento.map((fase) => (
                    <option key={fase} value={fase}>
                      {fase}
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Opciones generales de plazo">
                  {TIPOS_PLAZO_GENERALES.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </optgroup>
              </select>
              {errores.tipo ? (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errores.tipo}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Incluye las etapas de {etiquetaProcedimiento(procedimientoActivo).toLowerCase()} y opciones generales.
                </p>
              )}
            </div>

            {/* Fecha y hora límite */}
            <div>
              <label
                htmlFor="plazo-fechaLimite"
                className="block text-xs font-semibold text-slate-700 mb-1"
              >
                Fecha y hora límite <span className="text-red-600">*</span>
              </label>
              <input
                type="datetime-local"
                id="plazo-fechaLimite"
                name="fechaLimite"
                min={minFechaHoraApertura}
                value={formData.fechaLimite}
                onChange={handleChange}
                className={`w-full px-3.5 py-2.5 text-sm font-mono tabular-nums rounded-lg border bg-white text-slate-900 focus:outline-hidden transition-colors ${
                  errores.fechaLimite
                    ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                    : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
                }`}
              />
              {errores.fechaLimite ? (
                <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errores.fechaLimite}</span>
                </p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-500">
                  Debe ser igual o posterior a la apertura del expediente.
                </p>
              )}
            </div>
          </div>

          {/* Descripción obligatoria */}
          <div>
            <label
              htmlFor="plazo-descripcion"
              className="block text-xs font-semibold text-slate-700 mb-1"
            >
              Descripción del plazo <span className="text-red-600">*</span>
            </label>
            <textarea
              id="plazo-descripcion"
              name="descripcion"
              rows={3}
              value={formData.descripcion}
              onChange={handleChange}
              placeholder={
                esCasoPenal
                  ? 'Ej: Vencimiento de instrucción fiscal / presentación de elementos de convicción para audiencia preparatoria...'
                  : 'Ej: Término para contestación a la demanda o comparecencia a audiencia preliminar / de juicio...'
              }
              className={`w-full px-3.5 py-2.5 text-sm rounded-lg border bg-white text-slate-900 placeholder:text-slate-400 focus:outline-hidden transition-colors ${
                errores.descripcion
                  ? 'border-red-400 focus:border-red-600 focus:ring-1 focus:ring-red-500'
                  : 'border-slate-300 focus:border-slate-900 focus:ring-1 focus:ring-slate-900'
              }`}
            />
            {errores.descripcion && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errores.descripcion}</span>
              </p>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={guardando}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 active:bg-slate-950 rounded-lg shadow-2xs transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              <span>{guardando ? 'Guardando plazo...' : 'Guardar plazo procesal'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Listado cronológico de plazos asociados */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Cronograma de vencimientos ({plazosOrdenados.length})
            </h3>
            <p className="text-xs text-slate-500">
              Ordenados desde la fecha de vencimiento más cercana hasta la más lejana.
            </p>
          </div>

          {/* Controles de filtro por estado */}
          {plazos.length > 0 && (
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start sm:self-auto">
              {(
                [
                  { id: 'todos', label: `Todos (${plazos.length})` },
                  { id: 'Pendiente', label: `Pendientes (${totalPendientes})` },
                  { id: 'Presentado/Cumplido', label: `Cumplidos (${totalCumplidos})` },
                ] as const
              ).map((tab) => {
                const activo = filtroEstado === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setFiltroEstado(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      activo
                        ? 'bg-white text-slate-900 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {plazosOrdenados.length === 0 ? (
          <div className="border border-slate-200 rounded-xl p-8 text-center bg-white">
            <CalendarClock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-900">
              {plazos.length === 0
                ? 'No hay plazos procesales registrados en este expediente'
                : 'No hay plazos que coincidan con el filtro seleccionado'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {plazos.length === 0
                ? 'Utilice el formulario superior para registrar fechas límite de escritos, pruebas o fases procesales.'
                : 'Cambie el filtro de estado para visualizar los demás vencimientos.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {plazosOrdenados.map((plazo) => {
              const vencido = esPlazoVencido(plazo, ahoraMs);
              const cumplido = plazo.estado === 'Presentado/Cumplido';
              const estaConfirmando = confirmandoEliminarId === plazo.id;

              return (
                <div
                  key={plazo.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    vencido
                      ? 'border-red-300 bg-red-50/80'
                      : cumplido
                      ? 'border-emerald-200 bg-emerald-50/25'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  {/* Alerta roja obligatoria cuando está Pendiente y fecha <= actual */}
                  {vencido && (
                    <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-red-700">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>
                        Alerta de vencimiento: Plazo vencido o en fecha límite — Pendiente de presentación
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      {/* Metadatos sin cápsulas (Zero-Pill discipline) */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-bold text-slate-900">{plazo.tipo}</span>
                        {plazo.procedimiento && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-medium text-slate-600">
                              {etiquetaProcedimiento(plazo.procedimiento)}
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-mono tabular-nums font-semibold ${
                            vencido ? 'text-red-700' : 'text-slate-800'
                          }`}
                        >
                          Vence: {formatearFechaHora(plazo.fechaLimite)}
                        </span>
                        <span aria-hidden="true">·</span>
                        {cumplido ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Presentado/Cumplido</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              vencido ? 'text-red-700' : 'text-amber-700'
                            }`}
                          >
                            <Clock className="w-3.5 h-3.5" />
                            <span>Pendiente</span>
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                        {plazo.descripcion}
                      </p>

                      {cumplido && plazo.fechaCumplimiento && (
                        <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                          Registrado como cumplido el {formatearFechaHora(plazo.fechaCumplimiento)}
                        </p>
                      )}
                    </div>

                    {/* Acciones del plazo */}
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-200/70">
                      {plazo.estado === 'Pendiente' ? (
                        <button
                          type="button"
                          onClick={() =>
                            handleCambiarEstado(plazo.id, 'Presentado/Cumplido')
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Marcar Presentado/Cumplido</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleCambiarEstado(plazo.id, 'Pendiente')}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                          <span>Volver a Pendiente</span>
                        </button>
                      )}

                      {estaConfirmando ? (
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 border border-red-200 text-xs">
                          <span className="text-red-900 font-medium whitespace-nowrap">
                            ¿Eliminar?
                          </span>
                          <button
                            type="button"
                            onClick={() => handleEliminar(plazo.id)}
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
                          onClick={() => setConfirmandoEliminarId(plazo.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-2 text-xs font-medium text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                          title="Eliminar plazo"
                          aria-label="Eliminar plazo"
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
