/**
 * Definiciones de tipos para el MVP de Expediente Digital Legaltech
 * Conforme a las especificaciones de la historia de usuario (5.1, 5.2, 5.3)
 */

export type Materia = 'civil' | 'laboral' | 'penal' | 'administrativa' | 'otra';

export type EstadoExpediente = 'Abierto';

export interface CreadorRegistro {
  autenticado: boolean;
  identificador: string;
  detalle: string;
}

export interface Expediente {
  /** Identificador interno único (UUID v4), independiente del número judicial */
  id: string;
  /** Código legible con prefijo para el despacho (p.ej. EXP-2026-c8a41df2) */
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
  /** Tipo de asunto para precisar el caso (opcional) */
  tipoAsunto?: string;
  /** Bitácora / resumen inicial de hechos o instrucciones */
  bitacora?: string;
  /** Abogado/a responsable asignado (obligatorio) */
  responsable: string;
  /** Estado inicial inmutable en esta historia: 'Abierto' */
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
  tipoAsunto: string;
  bitacora: string;
  responsable: string;
  numeroProceso: string;
}

export interface ValidacionResultado {
  esValido: boolean;
  errores: Record<string, string>;
}
