/**
 * Definiciones de tipos para EXP-Legal (La Ola)
 * Cubre HU-01 (Expediente Digital), HU-02 (Plazos Procesales) y HU-03 (Bitácora de Actuaciones)
 */

export type Materia = 'civil' | 'laboral' | 'penal' | 'administrativa' | 'otra';

export type TipoProcedimiento = 'penal' | 'ordinario' | 'sumario';

export type EstadoExpediente = 'Abierto';

export interface CreadorRegistro {
  autenticado: boolean;
  identificador: string;
  detalle: string;
}

export interface Expediente {
  /** Identificador interno único (UUID v4), independiente del número judicial */
  id: string;
  /** Código legible con prefijo para el despacho (p.ej. EXP-2026-C8A41DF2) */
  codigoInterno: string;
  /** Número de proceso judicial externo (opcional) */
  numeroProceso?: string;
  /** Nombre o título del caso (obligatorio) */
  titulo: string;
  /** Nombre del cliente (obligatorio) */
  cliente: string;
  /** Materia del caso (obligatorio) */
  materia: Materia;
  /** Especificación si la materia es 'otra' */
  materiaOtra?: string;
  /** Tipo de procedimiento aplicable (penal, ordinario o sumario) */
  tipoProceso?: TipoProcedimiento;
  /** Tipo de asunto para precisar el caso (opcional) */
  tipoAsunto?: string;
  /** Bitácora / resumen inicial de hechos o instrucciones */
  bitacora?: string;
  /** Abogado/a responsable asignado (obligatorio) */
  responsable: string;
  /** Estado inicial inmutable en HU-01: 'Abierto' */
  estado: EstadoExpediente;
  /** Fecha y hora exacta de apertura en formato ISO */
  fechaApertura: string;
  /** Registro del creador según la sesión real del usuario */
  creador: CreadorRegistro;
}

export interface ExpedienteFormData {
  titulo: string;
  cliente: string;
  materia: Materia | '';
  materiaOtra: string;
  tipoProceso: TipoProcedimiento | '';
  tipoAsunto: string;
  bitacora: string;
  responsable: string;
  numeroProceso: string;
}

export interface ValidacionResultado {
  esValido: boolean;
  errores: Record<string, string>;
}

/**
 * HU-02: Control de plazos procesales para escritos, pruebas y fases del proceso
 */
export type TipoPlazoGeneral =
  | 'Presentación de escritos'
  | 'Anuncio/Práctica de prueba'
  | 'Recurso/Apelación'
  | 'Contestación'
  | 'Otro';

export type FaseProcesoPenal =
  | 'Investigación previa'
  | 'Formulación de cargos'
  | 'Instrucción fiscal'
  | 'Audiencia preparatoria de juicio'
  | 'Audiencia de juicio';

export type FaseProcesoOrdinario =
  | 'Presentar la demanda'
  | 'Notificaciones para completar actuaciones'
  | 'Citación'
  | 'Contestación a la demanda'
  | 'Reconvención y contestación'
  | 'Audiencia preliminar'
  | 'Audiencia de juicio'
  | 'Alegatos y resolución / Sentencia'
  | 'Ejecución de sentencia';

export type FaseProcesoSumario =
  | 'Presentar la demanda'
  | 'Notificaciones para completar actuaciones'
  | 'Citación'
  | 'Contestación a la demanda'
  | 'Audiencia única (Saneamiento y conciliación)'
  | 'Audiencia única (Prueba y alegatos)'
  | 'Audiencia de juicio'
  | 'Resolución / Sentencia'
  | 'Ejecución';

export type TipoPlazo =
  | TipoPlazoGeneral
  | FaseProcesoPenal
  | FaseProcesoOrdinario
  | FaseProcesoSumario;

export type EstadoPlazo = 'Pendiente' | 'Presentado/Cumplido';

export interface PlazoProcesal {
  id: string;
  expedienteId: string;
  tipo: TipoPlazo;
  procedimiento?: TipoProcedimiento;
  /** Fecha y hora límite en formato ISO */
  fechaLimite: string;
  descripcion: string;
  estado: EstadoPlazo;
  fechaCreacion: string;
  fechaCumplimiento?: string;
}

export interface PlazoFormData {
  tipo: TipoPlazo | '';
  procedimiento?: TipoProcedimiento;
  fechaLimite: string;
  descripcion: string;
}

/**
 * HU-03: Bitácora de actuaciones y novedades del caso
 */
export type TipoActuacion =
  | 'Providencia/Auto'
  | 'Audiencia'
  | 'Escrito ingresado'
  | 'Reunión con cliente'
  | 'Otro';

export interface ActuacionProcesal {
  id: string;
  expedienteId: string;
  /** Fecha de la actuación en formato YYYY-MM-DD */
  fecha: string;
  tipo: TipoActuacion;
  detalle: string;
  /** Timestamp ISO exacto de registro para desempate cronológico */
  fechaCreacion: string;
}

export interface ActuacionFormData {
  fecha: string;
  tipo: TipoActuacion | '';
  detalle: string;
}
