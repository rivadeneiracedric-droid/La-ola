import {
  Expediente,
  ExpedienteFormData,
  ValidacionResultado,
  CreadorRegistro,
  TipoProcedimiento,
  PlazoProcesal,
  PlazoFormData,
  TipoPlazo,
  TipoPlazoGeneral,
  FaseProcesoPenal,
  FaseProcesoOrdinario,
  FaseProcesoSumario,
  ActuacionProcesal,
  ActuacionFormData,
  TipoActuacion,
} from '../types/expediente.ts';

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

export function formatearCodigoInterno(uuid: string): string {
  const anio = new Date().getFullYear();
  const segmento = uuid.substring(0, 8).toUpperCase();
  return `EXP-${anio}-${segmento}`;
}

export function obtenerFechaLocalHoy(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

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
    errores.materia =
      'Debe seleccionar una materia jurídica (civil, laboral, penal, administrativa u otra).';
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

export function construirNuevoExpediente(
  formData: ExpedienteFormData,
  sesion?: { autenticado: boolean; email?: string }
): {
  exito: boolean;
  expediente?: Expediente;
  errores?: Record<string, string>;
  mensaje?: string;
} {
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
      detalle:
        'Sesión local no autenticada. No se asume identidad verificada ni se sustituye por el responsable.',
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
    materia: formData.materia as Expediente['materia'],
    materiaOtra: formData.materia === 'otra' ? formData.materiaOtra.trim() : undefined,
    tipoProceso: tipoProcesoFinal,
    tipoAsunto: formData.tipoAsunto ? formData.tipoAsunto.trim() : undefined,
    bitacora: formData.bitacora ? formData.bitacora.trim() : undefined,
    responsable: formData.responsable.trim(),
    estado: 'Abierto',
    fechaApertura,
    creador,
  };

  return {
    exito: true,
    expediente: nuevoExpediente,
  };
}

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

export const TIPOS_ACTUACION: TipoActuacion[] = [
  'Providencia/Auto',
  'Audiencia',
  'Escrito ingresado',
  'Reunión con cliente',
  'Otro',
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

export function ordenarPlazosCronologicamente(plazos: PlazoProcesal[]): PlazoProcesal[] {
  return [...plazos].sort(
    (a, b) => new Date(a.fechaLimite).getTime() - new Date(b.fechaLimite).getTime()
  );
}

export function esPlazoVencido(
  plazo: PlazoProcesal,
  referenciaMs: number = Date.now()
): boolean {
  if (plazo.estado !== 'Pendiente') return false;
  const limiteMs = new Date(plazo.fechaLimite).getTime();
  return !isNaN(limiteMs) && limiteMs <= referenciaMs;
}

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

export function construirNuevoPlazo(
  expediente: Expediente,
  formData: PlazoFormData
): {
  exito: boolean;
  plazo?: PlazoProcesal;
  errores?: Record<string, string>;
  mensaje?: string;
} {
  const validacion = validarFormularioPlazo(formData, expediente.fechaApertura);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje:
        'No se pudo registrar el plazo. Revise los campos obligatorios y las reglas de fecha.',
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

  return {
    exito: true,
    plazo: nuevoPlazo,
  };
}

export function ordenarActuacionesDescendente(
  actuaciones: ActuacionProcesal[]
): ActuacionProcesal[] {
  return [...actuaciones].sort((a, b) => {
    const cmpFecha = b.fecha.localeCompare(a.fecha);
    if (cmpFecha !== 0) return cmpFecha;
    return new Date(b.fechaCreacion).getTime() - new Date(a.fechaCreacion).getTime();
  });
}

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

export function construirNuevaActuacion(
  expedienteId: string,
  formData: ActuacionFormData
): {
  exito: boolean;
  actuacion?: ActuacionProcesal;
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

  const nuevaActuacion: ActuacionProcesal = {
    id: generarUUID(),
    expedienteId,
    fecha: formData.fecha.trim(),
    tipo: formData.tipo as TipoActuacion,
    detalle: formData.detalle.trim(),
    fechaCreacion: new Date().toISOString(),
  };

  return {
    exito: true,
    actuacion: nuevaActuacion,
  };
}
