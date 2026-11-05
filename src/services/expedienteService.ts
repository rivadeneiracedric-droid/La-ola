import {
  Expediente,
  ExpedienteFormData,
  ValidacionResultado,
  CreadorRegistro,
  TipoProcedimiento,
  PlazoProcesal,
  PlazoFormData,
  EstadoPlazo,
  TipoPlazo,
  TipoPlazoGeneral,
  FaseProcesoPenal,
  FaseProcesoOrdinario,
  FaseProcesoSumario,
  ActuacionProcesal,
  ActuacionFormData,
  TipoActuacion,
} from '../types/expediente';

const LEGACY_STORAGE_KEY = 'legaltech_expedientes_mvp_v1';
const STORAGE_KEY = 'legaltech_expedientes_mvp_v2';
const PLAZOS_STORAGE_KEY = 'exp_legal_plazos_v1';
const ACTUACIONES_STORAGE_KEY = 'exp_legal_actuaciones_v1';

/**
 * Genera un UUID v4 estándar independiente para identificadores internos.
 * No depende de ningún contador manual.
 */
export function generarUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera un código visual de despacho a partir del año y el UUID
 */
export function formatearCodigoInterno(uuid: string): string {
  const anio = new Date().getFullYear();
  const segmento = uuid.substring(0, 8).toUpperCase();
  return `EXP-${anio}-${segmento}`;
}

/**
 * Devuelve la fecha local actual en formato YYYY-MM-DD
 */
export function obtenerFechaLocalHoy(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Formatea una fecha ISO a YYYY-MM-DDTHH:mm en hora local para inputs datetime-local
 */
export function formatearFechaHoraLocalParaInput(fechaIso: string): string {
  const d = new Date(fechaIso);
  if (isNaN(d.getTime())) return '';
  const anio = d.getFullYear();
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  const hora = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${anio}-${mes}-${dia}T${hora}:${min}`;
}

/**
 * Parsea de forma determinista una cadena YYYY-MM-DDTHH:mm en hora local
 */
export function parsearFechaHoraLocal(valor: string): Date | null {
  if (!valor || !valor.trim()) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(valor.trim());
  if (match) {
    const [, anio, mes, dia, hora, minuto] = match;
    const fecha = new Date(
      Number(anio),
      Number(mes) - 1,
      Number(dia),
      Number(hora),
      Number(minuto),
      0,
      0
    );
    return isNaN(fecha.getTime()) ? null : fecha;
  }
  const fallback = new Date(valor);
  return isNaN(fallback.getTime()) ? null : fallback;
}

// ============================================================================
// HU-01: EXPEDIENTES DIGITALES
// ============================================================================

export function validarFormularioExpediente(data: ExpedienteFormData): ValidacionResultado {
  const errores: Record<string, string> = {};

  if (!data.titulo || !data.titulo.trim()) {
    errores.titulo = 'El título del caso es obligatorio para reconocer el asunto.';
  } else if (data.titulo.trim().length < 3) {
    errores.titulo = 'El título debe tener al menos 3 caracteres.';
  }

  if (!data.cliente || !data.cliente.trim()) {
    errores.cliente = 'El nombre del cliente es obligatorio.';
  } else if (data.cliente.trim().length < 2) {
    errores.cliente = 'Indique un nombre válido para el cliente.';
  }

  if (!data.materia) {
    errores.materia = 'Debe seleccionar una materia jurídica (civil, laboral, penal, administrativa u otra).';
  } else if (data.materia === 'otra' && (!data.materiaOtra || !data.materiaOtra.trim())) {
    errores.materiaOtra = 'Especifique la materia correspondiente.';
  }

  if (!data.responsable || !data.responsable.trim()) {
    errores.responsable = 'Debe ingresar el nombre del abogado/a responsable del caso.';
  } else if (data.responsable.trim().length < 2) {
    errores.responsable = 'Indique un nombre válido para el responsable.';
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
}

export function obtenerExpedientes(): Expediente[] {
  try {
    if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error al cargar expedientes:', error);
    return [];
  }
}

export function guardarExpedientes(expedientes: Expediente[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expedientes));
}

export function eliminarExpediente(id: string): Expediente[] {
  const actuales = obtenerExpedientes();
  const actualizados = actuales.filter((exp) => exp.id !== id);
  guardarExpedientes(actualizados);

  // Limpiar plazos y actuaciones vinculados al expediente eliminado
  const plazosRestantes = obtenerTodosLosPlazos().filter((p) => p.expedienteId !== id);
  guardarTodosLosPlazos(plazosRestantes);

  const actuacionesRestantes = obtenerTodasLasActuaciones().filter((a) => a.expedienteId !== id);
  guardarTodasLasActuaciones(actuacionesRestantes);

  return actualizados;
}

export function eliminarTodosLosExpedientes(): Expediente[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    guardarExpedientes([]);
    guardarTodosLosPlazos([]);
    guardarTodasLasActuaciones([]);
  } catch (error) {
    console.error('Error al borrar todos los expedientes:', error);
  }
  return [];
}

export function crearExpediente(
  formData: ExpedienteFormData,
  sesion?: { autenticado: boolean; email?: string }
): { exito: boolean; expediente?: Expediente; errores?: Record<string, string>; mensaje?: string } {
  const validacion = validarFormularioExpediente(formData);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje: 'Por favor complete todos los campos obligatorios requeridos.',
    };
  }

  const id = generarUUID();
  const codigoInterno = formatearCodigoInterno(id);
  const fechaApertura = new Date().toISOString();

  let creador: CreadorRegistro;
  if (sesion && sesion.autenticado && sesion.email) {
    creador = {
      autenticado: true,
      identificador: sesion.email,
      detalle: `Usuario verificado: ${sesion.email}`,
    };
  } else {
    creador = {
      autenticado: false,
      identificador: 'Sin autenticación',
      detalle: 'Sesión local no autenticada. No se asume identidad verificada ni se sustituye por el responsable.',
    };
  }

  let tipoProcesoFinal: TipoProcedimiento | undefined;
  if (formData.materia === 'penal') {
    tipoProcesoFinal = 'penal';
  } else if (formData.tipoProceso === 'ordinario' || formData.tipoProceso === 'sumario') {
    tipoProcesoFinal = formData.tipoProceso;
  }

  const nuevoExpediente: Expediente = {
    id,
    codigoInterno,
    numeroProceso: formData.numeroProceso ? formData.numeroProceso.trim() : undefined,
    titulo: formData.titulo.trim(),
    cliente: formData.cliente.trim(),
    materia: formData.materia as any,
    materiaOtra: formData.materia === 'otra' ? formData.materiaOtra.trim() : undefined,
    tipoProceso: tipoProcesoFinal,
    tipoAsunto: formData.tipoAsunto ? formData.tipoAsunto.trim() : undefined,
    bitacora: formData.bitacora ? formData.bitacora.trim() : undefined,
    responsable: formData.responsable.trim(),
    estado: 'Abierto',
    fechaApertura,
    creador,
  };

  try {
    const expedientes = obtenerExpedientes();
    expedientes.unshift(nuevoExpediente);
    guardarExpedientes(expedientes);

    return {
      exito: true,
      expediente: nuevoExpediente,
      mensaje: 'Expediente digital creado exitosamente.',
    };
  } catch {
    return {
      exito: false,
      mensaje: 'Ocurrió un error al guardar el expediente en el almacenamiento local.',
    };
  }
}

// ============================================================================
// HU-02: CONTROL DE PLAZOS PROCESALES PARA ESCRITOS, PRUEBAS Y FASES
// ============================================================================

export const TIPOS_PLAZO_GENERALES: TipoPlazoGeneral[] = [
  'Presentación de escritos',
  'Anuncio/Práctica de prueba',
  'Recurso/Apelación',
  'Contestación',
  'Otro',
];

export const FASES_PROCESO_PENAL: FaseProcesoPenal[] = [
  'Investigación previa',
  'Formulación de cargos',
  'Instrucción fiscal',
  'Audiencia preparatoria de juicio',
  'Audiencia de juicio',
];

export const FASES_PROCESO_ORDINARIO: FaseProcesoOrdinario[] = [
  'Presentar la demanda',
  'Notificaciones para completar actuaciones',
  'Citación',
  'Contestación a la demanda',
  'Reconvención y contestación',
  'Audiencia preliminar',
  'Audiencia de juicio',
  'Alegatos y resolución / Sentencia',
  'Ejecución de sentencia',
];

export const FASES_PROCESO_SUMARIO: FaseProcesoSumario[] = [
  'Presentar la demanda',
  'Notificaciones para completar actuaciones',
  'Citación',
  'Contestación a la demanda',
  'Audiencia única (Saneamiento y conciliación)',
  'Audiencia única (Prueba y alegatos)',
  'Audiencia de juicio',
  'Resolución / Sentencia',
  'Ejecución',
];

export function obtenerProcedimientoPorDefectoExpediente(
  expediente: Expediente
): TipoProcedimiento {
  if (expediente.materia === 'penal' || expediente.tipoProceso === 'penal') {
    return 'penal';
  }
  if (expediente.tipoProceso === 'sumario' || expediente.tipoProceso === 'ordinario') {
    return expediente.tipoProceso;
  }
  if (expediente.tipoAsunto && expediente.tipoAsunto.toLowerCase().includes('sumario')) {
    return 'sumario';
  }
  return 'ordinario';
}

export function obtenerFasesPorProcedimiento(
  procedimiento: TipoProcedimiento
): TipoPlazo[] {
  switch (procedimiento) {
    case 'penal':
      return FASES_PROCESO_PENAL;
    case 'sumario':
      return FASES_PROCESO_SUMARIO;
    case 'ordinario':
    default:
      return FASES_PROCESO_ORDINARIO;
  }
}

export function etiquetaProcedimiento(procedimiento: TipoProcedimiento): string {
  switch (procedimiento) {
    case 'penal':
      return 'Proceso Penal';
    case 'sumario':
      return 'Proceso Sumario';
    case 'ordinario':
    default:
      return 'Proceso Ordinario';
  }
}

export function actualizarTipoProcesoExpediente(
  expedienteId: string,
  tipoProceso: TipoProcedimiento
): Expediente[] {
  const actuales = obtenerExpedientes();
  const actualizados = actuales.map((exp) =>
    exp.id === expedienteId ? { ...exp, tipoProceso } : exp
  );
  guardarExpedientes(actualizados);
  return actualizados;
}

export function obtenerTodosLosPlazos(): PlazoProcesal[] {
  try {
    const raw = localStorage.getItem(PLAZOS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error al cargar plazos procesales:', error);
    return [];
  }
}

export function guardarTodosLosPlazos(plazos: PlazoProcesal[]): void {
  localStorage.setItem(PLAZOS_STORAGE_KEY, JSON.stringify(plazos));
}

/**
 * Ordena los plazos desde la fecha de vencimiento más cercana hasta la más lejana (Criterio 2)
 */
export function ordenarPlazosCronologicamente(plazos: PlazoProcesal[]): PlazoProcesal[] {
  return [...plazos].sort(
    (a, b) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
  );
}

export function obtenerPlazosPorExpediente(expedienteId: string): PlazoProcesal[] {
  const todos = obtenerTodosLosPlazos();
  return ordenarPlazosCronologicamente(
    todos.filter((p) => p.expedienteId === expedienteId)
  );
}

/**
 * Regla 3 (HU-02): Los plazos en estado "Pendiente" cuya fecha sea menor o igual
 * a la fecha actual deben destacarse visualmente con una alerta de advertencia (color rojo).
 */
export function esPlazoVencido(
  plazo: PlazoProcesal,
  referenciaMs: number = Date.now()
): boolean {
  if (plazo.estado !== 'Pendiente') return false;
  const limiteMs = new Date(plazo.fechaLimite).getTime();
  return !isNaN(limiteMs) && limiteMs <= referenciaMs;
}

/**
 * Valida un plazo procesal según reglas de HU-02:
 * 1. No se puede guardar un plazo si faltan el tipo de plazo, la fecha límite o la descripción.
 * 2. La fecha límite debe ser igual o posterior a la fecha de apertura del expediente.
 */
export function validarFormularioPlazo(
  data: PlazoFormData,
  fechaAperturaExpediente: string
): ValidacionResultado {
  const errores: Record<string, string> = {};

  if (!data.tipo) {
    errores.tipo = 'Debe seleccionar el tipo de plazo procesal.';
  }

  if (!data.fechaLimite || !data.fechaLimite.trim()) {
    errores.fechaLimite = 'Debe indicar la fecha y hora límite de vencimiento.';
  } else {
    const fechaLimiteDate = parsearFechaHoraLocal(data.fechaLimite);
    if (!fechaLimiteDate) {
      errores.fechaLimite = 'La fecha y hora límite ingresada no es válida.';
    } else {
      const aperturaDate = new Date(fechaAperturaExpediente);
      if (!isNaN(aperturaDate.getTime())) {
        const aperturaMinuto = new Date(aperturaDate.getTime());
        aperturaMinuto.setSeconds(0, 0);
        if (fechaLimiteDate.getTime() < aperturaMinuto.getTime()) {
          const aperturaFormateada = new Intl.DateTimeFormat('es-ES', {
            dateStyle: 'short',
            timeStyle: 'short',
          }).format(aperturaDate);
          errores.fechaLimite = `La fecha límite debe ser igual o posterior a la fecha de apertura del expediente (${aperturaFormateada}).`;
        }
      }
    }
  }

  if (!data.descripcion || !data.descripcion.trim()) {
    errores.descripcion = 'Debe ingresar una descripción para el plazo procesal.';
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
}

export function crearPlazoProcesal(
  expediente: Expediente,
  formData: PlazoFormData
): {
  exito: boolean;
  plazo?: PlazoProcesal;
  plazosExpediente?: PlazoProcesal[];
  errores?: Record<string, string>;
  mensaje?: string;
} {
  const validacion = validarFormularioPlazo(formData, expediente.fechaApertura);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje: 'No se pudo registrar el plazo. Revise los campos obligatorios y las reglas de fecha.',
    };
  }

  const fechaLimiteDate = parsearFechaHoraLocal(formData.fechaLimite)!;

  const procedimientoFinal =
    formData.procedimiento || obtenerProcedimientoPorDefectoExpediente(expediente);

  const nuevoPlazo: PlazoProcesal = {
    id: generarUUID(),
    expedienteId: expediente.id,
    tipo: formData.tipo as TipoPlazo,
    procedimiento: procedimientoFinal,
    fechaLimite: fechaLimiteDate.toISOString(),
    descripcion: formData.descripcion.trim(),
    estado: 'Pendiente',
    fechaCreacion: new Date().toISOString(),
  };

  try {
    const todos = obtenerTodosLosPlazos();
    todos.push(nuevoPlazo);
    guardarTodosLosPlazos(todos);

    return {
      exito: true,
      plazo: nuevoPlazo,
      plazosExpediente: ordenarPlazosCronologicamente(
        todos.filter((p) => p.expedienteId === expediente.id)
      ),
      mensaje: 'Plazo procesal registrado correctamente.',
    };
  } catch {
    return {
      exito: false,
      mensaje: 'Error al guardar el plazo en el almacenamiento local. Los datos ingresados se han conservado.',
    };
  }
}

export function actualizarEstadoPlazo(
  plazoId: string,
  nuevoEstado: EstadoPlazo
): { exito: boolean; todosLosPlazos?: PlazoProcesal[]; mensaje?: string } {
  try {
    const todos = obtenerTodosLosPlazos();
    const actualizados = todos.map((p) => {
      if (p.id !== plazoId) return p;
      return {
        ...p,
        estado: nuevoEstado,
        fechaCumplimiento:
          nuevoEstado === 'Presentado/Cumplido' ? new Date().toISOString() : undefined,
      };
    });
    guardarTodosLosPlazos(actualizados);
    return {
      exito: true,
      todosLosPlazos: actualizados,
    };
  } catch {
    return {
      exito: false,
      mensaje: 'No se pudo actualizar el estado del plazo procesal.',
    };
  }
}

export function eliminarPlazoProcesal(plazoId: string): {
  exito: boolean;
  todosLosPlazos?: PlazoProcesal[];
} {
  try {
    const actualizados = obtenerTodosLosPlazos().filter((p) => p.id !== plazoId);
    guardarTodosLosPlazos(actualizados);
    return { exito: true, todosLosPlazos: actualizados };
  } catch {
    return { exito: false };
  }
}

// ============================================================================
// HU-03: BITÁCORA DE ACTUACIONES Y NOVEDADES DEL CASO
// ============================================================================

export function obtenerTodasLasActuaciones(): ActuacionProcesal[] {
  try {
    const raw = localStorage.getItem(ACTUACIONES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error al cargar actuaciones procesales:', error);
    return [];
  }
}

export function guardarTodasLasActuaciones(actuaciones: ActuacionProcesal[]): void {
  localStorage.setItem(ACTUACIONES_STORAGE_KEY, JSON.stringify(actuaciones));
}

/**
 * Ordena las actuaciones cronológicamente de la más reciente a la más antigua (Regla 3 y Criterio 2)
 */
export function ordenarActuacionesDescendente(
  actuaciones: ActuacionProcesal[]
): ActuacionProcesal[] {
  return [...actuaciones].sort((a, b) => {
    const cmpFecha = b.fecha.localeCompare(a.fecha);
    if (cmpFecha !== 0) return cmpFecha;
    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
  });
}

export function obtenerActuacionesPorExpediente(expedienteId: string): ActuacionProcesal[] {
  const todas = obtenerTodasLasActuaciones();
  return ordenarActuacionesDescendente(
    todas.filter((a) => a.expedienteId === expedienteId)
  );
}

/**
 * Valida una actuación procesal según reglas de HU-03:
 * - Fecha de la actuación obligatoria
 * - Tipo de actuación obligatorio
 * - Detalle / Resumen obligatorio (Regla 2: No se pueden guardar actuaciones sin contenido en el detalle)
 */
export function validarFormularioActuacion(data: ActuacionFormData): ValidacionResultado {
  const errores: Record<string, string> = {};

  if (!data.fecha || !data.fecha.trim()) {
    errores.fecha = 'Debe seleccionar la fecha de la actuación.';
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(data.fecha.trim())) {
    errores.fecha = 'La fecha de la actuación no tiene un formato válido.';
  }

  if (!data.tipo) {
    errores.tipo = 'Debe seleccionar el tipo de actuación.';
  }

  if (!data.detalle || !data.detalle.trim()) {
    errores.detalle = 'Debe ingresar el detalle o resumen de la actuación.';
  }

  return {
    esValido: Object.keys(errores).length === 0,
    errores,
  };
}

export function crearActuacionProcesal(
  expedienteId: string,
  formData: ActuacionFormData
): {
  exito: boolean;
  actuacion?: ActuacionProcesal;
  actuacionesExpediente?: ActuacionProcesal[];
  errores?: Record<string, string>;
  mensaje?: string;
} {
  const validacion = validarFormularioActuacion(formData);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje: 'No se puede guardar la actuación. Complete los campos obligatorios marcados.',
    };
  }

  // Regla 1: Toda actuación registrada queda vinculada automáticamente al expediente activo
  const nuevaActuacion: ActuacionProcesal = {
    id: generarUUID(),
    expedienteId,
    fecha: formData.fecha.trim(),
    tipo: formData.tipo as TipoActuacion,
    detalle: formData.detalle.trim(),
    fechaCreacion: new Date().toISOString(),
  };

  try {
    const todas = obtenerTodasLasActuaciones();
    todas.push(nuevaActuacion);
    guardarTodasLasActuaciones(todas);

    return {
      exito: true,
      actuacion: nuevaActuacion,
      actuacionesExpediente: ordenarActuacionesDescendente(
        todas.filter((a) => a.expedienteId === expedienteId)
      ),
      mensaje: 'Actuación registrada en la bitácora del expediente.',
    };
  } catch {
    return {
      exito: false,
      mensaje: 'Error al guardar la actuación en el almacenamiento local. El texto ingresado se ha conservado.',
    };
  }
}

export function eliminarActuacionProcesal(actuacionId: string): {
  exito: boolean;
  todasLasActuaciones?: ActuacionProcesal[];
} {
  try {
    const actualizadas = obtenerTodasLasActuaciones().filter((a) => a.id !== actuacionId);
    guardarTodasLasActuaciones(actualizadas);
    return { exito: true, todasLasActuaciones: actualizadas };
  } catch {
    return { exito: false };
  }
}
