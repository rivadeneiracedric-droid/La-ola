import { Expediente, ExpedienteFormData, ValidacionResultado, CreadorRegistro } from '../types/expediente';

const LEGACY_STORAGE_KEY = 'legaltech_expedientes_mvp_v1';
const STORAGE_KEY = 'legaltech_expedientes_mvp_v2';

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
 * Obtiene los expedientes almacenados localmente.
 * Inicia vacío (sin datos ficticios precargados) y limpia registros heredados previos.
 */
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
 * Elimina un expediente individual por su identificador interno (UUID)
 */
export function eliminarExpediente(id: string): Expediente[] {
  const actuales = obtenerExpedientes();
  const actualizados = actuales.filter((exp) => exp.id !== id);
  guardarExpedientes(actualizados);
  return actualizados;
}

/**
 * Borra todos los expedientes registrados
 */
export function eliminarTodosLosExpedientes(): Expediente[] {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    guardarExpedientes([]);
  } catch (error) {
    console.error('Error al borrar todos los expedientes:', error);
  }
  return [];
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
