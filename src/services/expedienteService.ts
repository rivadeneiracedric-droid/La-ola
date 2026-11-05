import {
  Expediente,
  ExpedienteFormData,
  TipoProcedimiento,
  PlazoProcesal,
  PlazoFormData,
  EstadoPlazo,
  ActuacionProcesal,
  ActuacionFormData,
} from '../types/expediente';
import {
  generarUUID,
  formatearCodigoInterno,
  obtenerFechaLocalHoy,
  formatearFechaHoraLocalParaInput,
  parsearFechaHoraLocal,
  validarFormularioExpediente,
  construirNuevoExpediente,
  TIPOS_PLAZO_GENERALES,
  FASES_PROCESO_PENAL,
  FASES_PROCESO_ORDINARIO,
  FASES_PROCESO_SUMARIO,
  TIPOS_ACTUACION,
  obtenerProcedimientoPorDefectoExpediente,
  obtenerFasesPorProcedimiento,
  etiquetaProcedimiento,
  ordenarPlazosCronologicamente,
  esPlazoVencido,
  validarFormularioPlazo,
  construirNuevoPlazo,
  ordenarActuacionesDescendente,
  validarFormularioActuacion,
  construirNuevaActuacion,
} from '../shared/expedienteDomain';

export {
  generarUUID,
  formatearCodigoInterno,
  obtenerFechaLocalHoy,
  formatearFechaHoraLocalParaInput,
  parsearFechaHoraLocal,
  validarFormularioExpediente,
  TIPOS_PLAZO_GENERALES,
  FASES_PROCESO_PENAL,
  FASES_PROCESO_ORDINARIO,
  FASES_PROCESO_SUMARIO,
  TIPOS_ACTUACION,
  obtenerProcedimientoPorDefectoExpediente,
  obtenerFasesPorProcedimiento,
  etiquetaProcedimiento,
  ordenarPlazosCronologicamente,
  esPlazoVencido,
  validarFormularioPlazo,
  ordenarActuacionesDescendente,
  validarFormularioActuacion,
};

const LEGACY_STORAGE_KEY = 'legaltech_expedientes_mvp_v1';
const STORAGE_KEY = 'legaltech_expedientes_mvp_v2';
const PLAZOS_STORAGE_KEY = 'exp_legal_plazos_v1';
const ACTUACIONES_STORAGE_KEY = 'exp_legal_actuaciones_v1';
const SUPABASE_MIGRATED_KEY = 'exp_legal_supabase_migrated_v1';

export type ModoAlmacenamiento = 'supabase' | 'local';

let modoAlmacenamientoActual: ModoAlmacenamiento = 'local';

export function obtenerModoAlmacenamiento(): ModoAlmacenamiento {
  return modoAlmacenamientoActual;
}

// ============================================================================
// CAPA LOCAL DE RESPALDO (localStorage)
// ============================================================================

export function obtenerExpedientes(): Expediente[] {
  try {
    if (localStorage.getItem(LEGACY_STORAGE_KEY) !== null) {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('No se pudieron cargar expedientes locales:', error);
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

  const plazosRestantes = obtenerTodosLosPlazos().filter((p) => p.expedienteId !== id);
  guardarTodosLosPlazos(plazosRestantes);

  const actuacionesRestantes = obtenerTodasLasActuaciones().filter(
    (a) => a.expedienteId !== id
  );
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
    console.warn('No se pudieron limpiar expedientes locales:', error);
  }
  return [];
}

export function crearExpediente(
  formData: ExpedienteFormData,
  sesion?: { autenticado: boolean; email?: string }
): {
  exito: boolean;
  expediente?: Expediente;
  errores?: Record<string, string>;
  mensaje?: string;
} {
  const construido = construirNuevoExpediente(formData, sesion);
  if (!construido.exito || !construido.expediente) {
    return construido;
  }

  try {
    const expedientes = obtenerExpedientes();
    expedientes.unshift(construido.expediente);
    guardarExpedientes(expedientes);

    return {
      exito: true,
      expediente: construido.expediente,
      mensaje: 'Expediente digital creado exitosamente.',
    };
  } catch {
    return {
      exito: false,
      mensaje: 'Ocurrió un error al guardar el expediente en el almacenamiento local.',
    };
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
    console.warn('No se pudieron cargar plazos locales:', error);
    return [];
  }
}

export function guardarTodosLosPlazos(plazos: PlazoProcesal[]): void {
  localStorage.setItem(PLAZOS_STORAGE_KEY, JSON.stringify(plazos));
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
  const construido = construirNuevoPlazo(expediente, formData);
  if (!construido.exito || !construido.plazo) {
    return construido;
  }

  try {
    const todos = obtenerTodosLosPlazos();
    todos.push(construido.plazo);
    guardarTodosLosPlazos(todos);

    return {
      exito: true,
      plazo: construido.plazo,
      plazosExpediente: ordenarPlazosCronologicamente(
        todos.filter((p) => p.expedienteId === expediente.id)
      ),
      mensaje: 'Plazo procesal registrado correctamente.',
    };
  } catch {
    return {
      exito: false,
      mensaje:
        'Error al guardar el plazo en el almacenamiento local. Los datos ingresados se han conservado.',
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

export function obtenerTodasLasActuaciones(): ActuacionProcesal[] {
  try {
    const raw = localStorage.getItem(ACTUACIONES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn('No se pudieron cargar actuaciones locales:', error);
    return [];
  }
}

export function guardarTodasLasActuaciones(actuaciones: ActuacionProcesal[]): void {
  localStorage.setItem(ACTUACIONES_STORAGE_KEY, JSON.stringify(actuaciones));
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
  const construido = construirNuevaActuacion(expedienteId, formData);
  if (!construido.exito || !construido.actuacion) {
    return construido;
  }

  try {
    const todas = obtenerTodasLasActuaciones();
    todas.push(construido.actuacion);
    guardarTodasLasActuaciones(todas);

    return {
      exito: true,
      actuacion: construido.actuacion,
      actuacionesExpediente: ordenarActuacionesDescendente(
        todas.filter((a) => a.expedienteId === expedienteId)
      ),
      mensaje: 'Actuación registrada en la bitácora del expediente.',
    };
  } catch {
    return {
      exito: false,
      mensaje:
        'Error al guardar la actuación en el almacenamiento local. El texto ingresado se ha conservado.',
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

// ============================================================================
// CAPA ASÍNCRONA CON SUPABASE (/api/*)
// ============================================================================

export async function inicializarAlmacenamiento(): Promise<{
  mode: ModoAlmacenamiento;
  expedientes: Expediente[];
  plazos: PlazoProcesal[];
  actuaciones: ActuacionProcesal[];
  error?: string;
}> {
  for (let intento = 0; intento < 2; intento++) {
    try {
      const res = await fetch('/api/bootstrap');
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        modoAlmacenamientoActual = 'local';
        return {
          mode: 'local',
          expedientes: obtenerExpedientes(),
          plazos: obtenerTodosLosPlazos(),
          actuaciones: obtenerTodasLasActuaciones(),
        };
      }

      const payload = await res.json();
      if (payload.mode === 'supabase') {
        modoAlmacenamientoActual = 'supabase';
        if (!res.ok || payload.error) {
          return {
            mode: 'supabase',
            expedientes: [],
            plazos: [],
            actuaciones: [],
            error:
              payload.error ||
              'No se pudo inicializar la conexión con Supabase. Verifica las variables y el esquema SQL.',
          };
        }

        const expedientesRemotos: Expediente[] = Array.isArray(payload.expedientes)
          ? payload.expedientes
          : [];
        const plazosRemotos: PlazoProcesal[] = Array.isArray(payload.plazos)
          ? payload.plazos
          : [];
        const actuacionesRemotas: ActuacionProcesal[] = Array.isArray(payload.actuaciones)
          ? payload.actuaciones
          : [];

        if (
          expedientesRemotos.length === 0 &&
          localStorage.getItem(SUPABASE_MIGRATED_KEY) !== 'true'
        ) {
          const localesExp = obtenerExpedientes();
          if (localesExp.length > 0) {
            const syncRes = await fetch('/api/sync-local', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                expedientes: localesExp,
                plazos: obtenerTodosLosPlazos(),
                actuaciones: obtenerTodasLasActuaciones(),
              }),
            });
            if (syncRes.ok) {
              const synced = await syncRes.json();
              localStorage.setItem(SUPABASE_MIGRATED_KEY, 'true');
              return {
                mode: 'supabase',
                expedientes: synced.expedientes || [],
                plazos: synced.plazos || [],
                actuaciones: synced.actuaciones || [],
              };
            }
          }
        }

        return {
          mode: 'supabase',
          expedientes: expedientesRemotos,
          plazos: plazosRemotos,
          actuaciones: actuacionesRemotas,
        };
      }

      break;
    } catch {
      if (intento === 0) {
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    }
  }

  modoAlmacenamientoActual = 'local';
  return {
    mode: 'local',
    expedientes: obtenerExpedientes(),
    plazos: obtenerTodosLosPlazos(),
    actuaciones: obtenerTodasLasActuaciones(),
  };
}

export async function crearExpedienteAsync(
  formData: ExpedienteFormData,
  sesion?: { autenticado: boolean; email?: string }
): Promise<{
  exito: boolean;
  expediente?: Expediente;
  errores?: Record<string, string>;
  mensaje?: string;
}> {
  const validacion = validarFormularioExpediente(formData);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje: 'Por favor complete todos los campos obligatorios requeridos.',
    };
  }

  if (modoAlmacenamientoActual !== 'supabase') {
    return crearExpediente(formData, sesion);
  }

  try {
    const res = await fetch('/api/expedientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formData, sesion }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        exito: false,
        errores: data.errores || {},
        mensaje: data.error || 'No se pudo guardar el expediente en Supabase.',
      };
    }
    return {
      exito: true,
      expediente: data.expediente as Expediente,
      mensaje: 'Expediente digital creado exitosamente.',
    };
  } catch {
    return {
      exito: false,
      mensaje:
        'Error de red al guardar el expediente en Supabase. Los datos ingresados se conservan.',
    };
  }
}

export async function actualizarTipoProcesoExpedienteAsync(
  expedienteId: string,
  tipoProceso: TipoProcedimiento
): Promise<{ exito: boolean; expediente?: Expediente; mensaje?: string }> {
  if (modoAlmacenamientoActual !== 'supabase') {
    const actualizados = actualizarTipoProcesoExpediente(expedienteId, tipoProceso);
    const encontrado = actualizados.find((e) => e.id === expedienteId);
    return { exito: true, expediente: encontrado };
  }

  try {
    const res = await fetch(`/api/expedientes/${expedienteId}/tipo-proceso`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipoProceso }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        exito: false,
        mensaje: data.error || 'No se pudo actualizar el tipo de procedimiento en Supabase.',
      };
    }
    return { exito: true, expediente: data.expediente as Expediente };
  } catch {
    return {
      exito: false,
      mensaje: 'Error de red al actualizar el tipo de procedimiento.',
    };
  }
}

export async function eliminarExpedienteAsync(
  id: string
): Promise<{ exito: boolean; mensaje?: string }> {
  if (modoAlmacenamientoActual !== 'supabase') {
    eliminarExpediente(id);
    return { exito: true };
  }

  try {
    const res = await fetch(`/api/expedientes/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        exito: false,
        mensaje: data.error || 'No se pudo eliminar el expediente en Supabase.',
      };
    }
    return { exito: true };
  } catch {
    return {
      exito: false,
      mensaje: 'Error de red al eliminar el expediente.',
    };
  }
}

export async function eliminarTodosLosExpedientesAsync(): Promise<{
  exito: boolean;
  mensaje?: string;
}> {
  if (modoAlmacenamientoActual !== 'supabase') {
    eliminarTodosLosExpedientes();
    return { exito: true };
  }

  try {
    const res = await fetch('/api/expedientes', {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        exito: false,
        mensaje: data.error || 'No se pudieron borrar los expedientes en Supabase.',
      };
    }
    localStorage.setItem(SUPABASE_MIGRATED_KEY, 'true');
    return { exito: true };
  } catch {
    return {
      exito: false,
      mensaje: 'Error de red al limpiar los expedientes.',
    };
  }
}

export async function crearPlazoProcesalAsync(
  expediente: Expediente,
  formData: PlazoFormData
): Promise<{
  exito: boolean;
  plazo?: PlazoProcesal;
  plazosExpediente?: PlazoProcesal[];
  errores?: Record<string, string>;
  mensaje?: string;
}> {
  const validacion = validarFormularioPlazo(formData, expediente.fechaApertura);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje:
        'No se pudo registrar el plazo. Revise los campos obligatorios y las reglas de fecha.',
    };
  }

  if (modoAlmacenamientoActual !== 'supabase') {
    return crearPlazoProcesal(expediente, formData);
  }

  try {
    const res = await fetch(`/api/expedientes/${expediente.id}/plazos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        exito: false,
        errores: data.errores || {},
        mensaje: data.error || 'No se pudo guardar el plazo procesal en Supabase.',
      };
    }
    return {
      exito: true,
      plazo: data.plazo as PlazoProcesal,
      plazosExpediente: data.plazosExpediente as PlazoProcesal[],
      mensaje: 'Plazo procesal registrado correctamente.',
    };
  } catch {
    return {
      exito: false,
      mensaje:
        'Error de red al guardar el plazo en Supabase. Los datos ingresados se conservan.',
    };
  }
}

export async function actualizarEstadoPlazoAsync(
  plazoId: string,
  nuevoEstado: EstadoPlazo
): Promise<{ exito: boolean; plazo?: PlazoProcesal; mensaje?: string }> {
  if (modoAlmacenamientoActual !== 'supabase') {
    const res = actualizarEstadoPlazo(plazoId, nuevoEstado);
    const actualizado = res.todosLosPlazos?.find((p) => p.id === plazoId);
    return { exito: res.exito, plazo: actualizado, mensaje: res.mensaje };
  }

  try {
    const res = await fetch(`/api/plazos/${plazoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        exito: false,
        mensaje: data.error || 'No se pudo actualizar el estado del plazo en Supabase.',
      };
    }
    return { exito: true, plazo: data.plazo as PlazoProcesal };
  } catch {
    return {
      exito: false,
      mensaje: 'Error de red al actualizar el estado del plazo.',
    };
  }
}

export async function eliminarPlazoProcesalAsync(
  plazoId: string
): Promise<{ exito: boolean; mensaje?: string }> {
  if (modoAlmacenamientoActual !== 'supabase') {
    const res = eliminarPlazoProcesal(plazoId);
    return { exito: res.exito };
  }

  try {
    const res = await fetch(`/api/plazos/${plazoId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        exito: false,
        mensaje: data.error || 'No se pudo eliminar el plazo procesal en Supabase.',
      };
    }
    return { exito: true };
  } catch {
    return {
      exito: false,
      mensaje: 'Error de red al eliminar el plazo procesal.',
    };
  }
}

export async function crearActuacionProcesalAsync(
  expedienteId: string,
  formData: ActuacionFormData
): Promise<{
  exito: boolean;
  actuacion?: ActuacionProcesal;
  actuacionesExpediente?: ActuacionProcesal[];
  errores?: Record<string, string>;
  mensaje?: string;
}> {
  const validacion = validarFormularioActuacion(formData);
  if (!validacion.esValido) {
    return {
      exito: false,
      errores: validacion.errores,
      mensaje: 'No se puede guardar la actuación. Complete los campos obligatorios marcados.',
    };
  }

  if (modoAlmacenamientoActual !== 'supabase') {
    return crearActuacionProcesal(expedienteId, formData);
  }

  try {
    const res = await fetch(`/api/expedientes/${expedienteId}/actuaciones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        exito: false,
        errores: data.errores || {},
        mensaje: data.error || 'No se pudo guardar la actuación en Supabase.',
      };
    }
    return {
      exito: true,
      actuacion: data.actuacion as ActuacionProcesal,
      actuacionesExpediente: data.actuacionesExpediente as ActuacionProcesal[],
      mensaje: 'Actuación registrada en la bitácora del expediente.',
    };
  } catch {
    return {
      exito: false,
      mensaje:
        'Error de red al guardar la actuación en Supabase. El texto ingresado se conserva.',
    };
  }
}

export async function eliminarActuacionProcesalAsync(
  actuacionId: string
): Promise<{ exito: boolean; mensaje?: string }> {
  if (modoAlmacenamientoActual !== 'supabase') {
    const res = eliminarActuacionProcesal(actuacionId);
    return { exito: res.exito };
  }

  try {
    const res = await fetch(`/api/actuaciones/${actuacionId}`, {
      method: 'DELETE',
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        exito: false,
        mensaje: data.error || 'No se pudo eliminar la actuación en Supabase.',
      };
    }
    return { exito: true };
  } catch {
    return {
      exito: false,
      mensaje: 'Error de red al eliminar la actuación.',
    };
  }
}
