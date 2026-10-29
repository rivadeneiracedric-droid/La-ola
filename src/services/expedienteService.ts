import { Expediente, ExpedienteFormData, ValidacionResultado, CreadorRegistro } from '../types/expediente';

const STORAGE_KEY = 'legaltech_expedientes_mvp_v1';

/**
 * Genera un UUID v4 estándar independiente para el identificador interno del expediente.
 * No depende de ningún contador manual.
 */
export function generarUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4
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
 * Valida los datos del formulario según las reglas de negocio de la Historia 5.3:
 * 1. No se puede crear un expediente sin título, cliente, materia y responsable.
 * 2. Los campos de texto obligatorios deben completarse (sin espacios en blanco).
 * 3. El identificador interno se genera automáticamente (no del usuario).
 * 4. El número de proceso judicial es opcional.
 */
export function validarFormularioExpediente(data: ExpedienteFormData): ValidacionResultado {
  const errores: Record<string, string> = {};

  // Validación 1 & 2: Título del caso
  if (!data.titulo || !data.titulo.trim()) {
    errores.titulo = 'El título del caso es obligatorio para reconocer el asunto.';
  } else if (data.titulo.trim().length < 3) {
    errores.titulo = 'El título debe tener al menos 3 caracteres.';
  }

  // Validación 1 & 2: Cliente
  if (!data.cliente || !data.cliente.trim()) {
    errores.cliente = 'El nombre del cliente es obligatorio.';
  } else if (data.cliente.trim().length < 2) {
    errores.cliente = 'Indique un nombre válido para el cliente.';
  }

  // Validación 1 & 2: Materia
  if (!data.materia) {
    errores.materia = 'Debe seleccionar una materia jurídica (civil, laboral, penal, administrativa u otra).';
  } else if (data.materia === 'otra' && (!data.materiaOtra || !data.materiaOtra.trim())) {
    errores.materiaOtra = 'Especifique la materia correspondiente.';
  }

  // Validación 1 & 2: Responsable
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

/**
 * Obtiene los expedientes almacenados localmente
 */
export function obtenerExpedientes(): Expediente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const iniciales = obtenerExpedientesIniciales();
      guardarExpedientes(iniciales);
      return iniciales;
    }
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error al cargar expedientes:', error);
    return obtenerExpedientesIniciales();
  }
}

/**
 * Guarda la lista de expedientes
 */
export function guardarExpedientes(expedientes: Expediente[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expedientes));
  } catch (error) {
    console.error('Error al guardar expedientes:', error);
  }
}

/**
 * Crea un nuevo expediente aplicando validaciones y reglas estrictas del alcance 5.1-5.3
 */
export function crearExpediente(
  formData: ExpedienteFormData,
  sesion?: { autenticado: boolean; email?: string }
): { exito: boolean; expediente?: Expediente; errores?: Record<string, string>; mensaje?: string } {
  // Validar campos
  const validacion = validarFormularioExpediente(formData);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje: 'Por favor complete todos los campos obligatorios requeridos.',
    };
  }

  // Generar identificador interno único independiente (UUID v4)
  const id = generarUUID();
  const codigoInterno = formatearCodigoInterno(id);
  const fechaApertura = new Date().toISOString();

  // Gestión de Creador (Regla 5.2):
  // "Se registra a partir de la sesión autenticada cuando exista.
  // Sin autenticación, no se inventa una identidad ni se presenta al responsable como creador verificado."
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

  const nuevoExpediente: Expediente = {
    id,
    codigoInterno,
    numeroProceso: formData.numeroProceso ? formData.numeroProceso.trim() : undefined,
    titulo: formData.titulo.trim(),
    cliente: formData.cliente.trim(),
    materia: formData.materia as any,
    materiaOtra: formData.materia === 'otra' ? formData.materiaOtra.trim() : undefined,
    tipoAsunto: formData.tipoAsunto ? formData.tipoAsunto.trim() : undefined,
    bitacora: formData.bitacora ? formData.bitacora.trim() : undefined,
    responsable: formData.responsable.trim(),
    estado: 'Abierto', // Regla 5.2: Valor inicial "Abierto". No se implementan todavía cambios de estado.
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
  } catch (err: any) {
    return {
      exito: false,
      mensaje: 'Ocurrió un error al guardar el expediente en la base local.',
    };
  }
}

/**
 * Expedientes de demostración inicial para verificar el comportamiento de la ficha
 */
function obtenerExpedientesIniciales(): Expediente[] {
  const uuid1 = '9a31b412-58e1-4c78-b1c2-721389e144a0';
  const uuid2 = '4f8812c9-66d4-4b92-938a-e95ba12003c4';

  return [
    {
      id: uuid1,
      codigoInterno: 'EXP-2026-9A31B412',
      numeroProceso: '09332-2026-00412',
      titulo: 'Demanda ordinaria laboral por despido intempestivo',
      cliente: 'Construcciones y Proyectos Civiles S.A.',
      materia: 'laboral',
      tipoAsunto: 'Despido intempestivo e indemnización',
      bitacora: 'Reunión inicial celebrada el 20 de octubre. El cliente aportó contratos y finiquitos observados. Se remitió requerimiento prejudicial a la contraparte.',
      responsable: 'Dra. María Elena Salgado',
      estado: 'Abierto',
      fechaApertura: '2026-10-24T14:30:00.000Z',
      creador: {
        autenticado: true,
        identificador: 'rivadeneiracedric@gmail.com',
        detalle: 'Usuario verificado: rivadeneiracedric@gmail.com',
      },
    },
    {
      id: uuid2,
      codigoInterno: 'EXP-2026-4F8812C9',
      numeroProceso: '', // Opcional: sin radicar todavía
      titulo: 'Sucesión intestada y partición extrajudicial',
      cliente: 'Familia Andrade Morales',
      materia: 'civil',
      tipoAsunto: 'Posesión efectiva de bienes hereditarios',
      bitacora: 'Se recopilaron partidas de nacimiento y defunción. Pendiente inventario solemne de bienes inmuebles ante notaría pública.',
      responsable: 'Abg. Roberto Carlos Mena',
      estado: 'Abierto',
      fechaApertura: '2026-10-27T09:15:00.000Z',
      creador: {
        autenticado: false,
        identificador: 'Sin autenticación',
        detalle: 'Sesión local no autenticada. No se asume identidad verificada ni se sustituye por el responsable.',
      },
    },
  ];
}
