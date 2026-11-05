import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Expediente,
  ExpedienteFormData,
  PlazoProcesal,
  PlazoFormData,
  ActuacionProcesal,
  ActuacionFormData,
  TipoProcedimiento,
  EstadoPlazo,
} from './src/types/expediente.ts';
import {
  construirNuevoExpediente,
  construirNuevoPlazo,
  construirNuevaActuacion,
  ordenarPlazosCronologicamente,
  ordenarActuacionesDescendente,
} from './src/shared/expedienteDomain.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExpedienteRow {
  id: string;
  codigo_interno: string;
  numero_proceso: string | null;
  titulo: string;
  cliente: string;
  materia: Expediente['materia'];
  materia_otra: string | null;
  tipo_proceso: TipoProcedimiento | null;
  tipo_asunto: string | null;
  bitacora: string | null;
  responsable: string;
  estado: 'Abierto';
  fecha_apertura: string;
  creador: Expediente['creador'];
}

interface PlazoRow {
  id: string;
  expediente_id: string;
  tipo: PlazoProcesal['tipo'];
  procedimiento: TipoProcedimiento | null;
  fecha_limite: string;
  descripcion: string;
  estado: EstadoPlazo;
  fecha_creacion: string;
  fecha_cumplimiento: string | null;
}

interface ActuacionRow {
  id: string;
  expediente_id: string;
  fecha: string;
  tipo: ActuacionProcesal['tipo'];
  detalle: string;
  fecha_creacion: string;
}

let cachedSupabase: SupabaseClient | null = null;

function createSupabaseServerClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_ANON_KEY?.trim();

  if (
    !url ||
    !key ||
    url === 'MY_SUPABASE_URL' ||
    key === 'MY_SUPABASE_ANON_KEY'
  ) {
    return null;
  }

  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch {
    return null;
  }
}

function getSupabaseClient(): SupabaseClient | null {
  if (cachedSupabase) return cachedSupabase;
  cachedSupabase = createSupabaseServerClient();
  return cachedSupabase;
}

function mapRowToExpediente(row: ExpedienteRow): Expediente {
  return {
    id: row.id,
    codigoInterno: row.codigo_interno,
    numeroProceso: row.numero_proceso ?? undefined,
    titulo: row.titulo,
    cliente: row.cliente,
    materia: row.materia,
    materiaOtra: row.materia_otra ?? undefined,
    tipoProceso: row.tipo_proceso ?? undefined,
    tipoAsunto: row.tipo_asunto ?? undefined,
    bitacora: row.bitacora ?? undefined,
    responsable: row.responsable,
    estado: row.estado,
    fechaApertura: new Date(row.fecha_apertura).toISOString(),
    creador: row.creador,
  };
}

function mapExpedienteToRow(exp: Expediente): ExpedienteRow {
  return {
    id: exp.id,
    codigo_interno: exp.codigoInterno,
    numero_proceso: exp.numeroProceso ?? null,
    titulo: exp.titulo,
    cliente: exp.cliente,
    materia: exp.materia,
    materia_otra: exp.materiaOtra ?? null,
    tipo_proceso: exp.tipoProceso ?? null,
    tipo_asunto: exp.tipoAsunto ?? null,
    bitacora: exp.bitacora ?? null,
    responsable: exp.responsable,
    estado: exp.estado,
    fecha_apertura: exp.fechaApertura,
    creador: exp.creador,
  };
}

function mapRowToPlazo(row: PlazoRow): PlazoProcesal {
  return {
    id: row.id,
    expedienteId: row.expediente_id,
    tipo: row.tipo,
    procedimiento: row.procedimiento ?? undefined,
    fechaLimite: new Date(row.fecha_limite).toISOString(),
    descripcion: row.descripcion,
    estado: row.estado,
    fechaCreacion: new Date(row.fecha_creacion).toISOString(),
    fechaCumplimiento: row.fecha_cumplimiento
      ? new Date(row.fecha_cumplimiento).toISOString()
      : undefined,
  };
}

function mapPlazoToRow(plazo: PlazoProcesal): PlazoRow {
  return {
    id: plazo.id,
    expediente_id: plazo.expedienteId,
    tipo: plazo.tipo,
    procedimiento: plazo.procedimiento ?? null,
    fecha_limite: plazo.fechaLimite,
    descripcion: plazo.descripcion,
    estado: plazo.estado,
    fecha_creacion: plazo.fechaCreacion,
    fecha_cumplimiento: plazo.fechaCumplimiento ?? null,
  };
}

function mapRowToActuacion(row: ActuacionRow): ActuacionProcesal {
  return {
    id: row.id,
    expedienteId: row.expediente_id,
    fecha: typeof row.fecha === 'string' ? row.fecha.slice(0, 10) : String(row.fecha),
    tipo: row.tipo,
    detalle: row.detalle,
    fechaCreacion: new Date(row.fecha_creacion).toISOString(),
  };
}

function mapActuacionToRow(act: ActuacionProcesal): ActuacionRow {
  return {
    id: act.id,
    expediente_id: act.expedienteId,
    fecha: act.fecha,
    tipo: act.tipo,
    detalle: act.detalle,
    fecha_creacion: act.fechaCreacion,
  };
}

function sanitizeDatabaseError(err: unknown): {
  error: string;
  missingTables?: boolean;
} {
  const errObj =
    typeof err === 'object' && err !== null
      ? (err as { message?: unknown; code?: unknown; status?: unknown })
      : {};
  const msg = String(errObj.message || '');
  const code = String(errObj.code || '');
  const lower = msg.toLowerCase();

  if (
    code === 'PGRST205' ||
    lower.includes('could not find the table') ||
    (lower.includes('relation') && lower.includes('does not exist'))
  ) {
    return {
      missingTables: true,
      error:
        'Las tablas de Supabase aún no existen. Ejecuta el script SQL en el SQL Editor de tu proyecto Supabase y recarga la página.',
    };
  }

  if (
    code === '42501' ||
    lower.includes('permission denied') ||
    lower.includes('row-level security')
  ) {
    return {
      error:
        'Las políticas de seguridad (RLS) de Supabase bloquearon la consulta. Ejecuta las sentencias CREATE POLICY incluidas en el script SQL.',
    };
  }

  if (
    errObj.status === 401 ||
    lower.includes('invalid api key') ||
    lower.includes('jwt')
  ) {
    return {
      error:
        'La clave SUPABASE_ANON_KEY o la URL SUPABASE_URL no es válida. Verifica ambos valores en Secrets.',
    };
  }

  return {
    error: `Error al comunicarse con Supabase${code ? ` (${code})` : ''}${msg ? `: ${msg}` : '.'}`,
  };
}

async function fetchFullDatasetWithRetry(
  supabase: SupabaseClient,
  retries = 2
) {
  let lastError: unknown;
  for (let intento = 0; intento <= retries; intento++) {
    try {
      const [expRes, plazosRes, actRes] = await Promise.all([
        supabase
          .from('expedientes')
          .select('*')
          .order('fecha_apertura', { ascending: false }),
        supabase
          .from('plazos_procesales')
          .select('*')
          .order('fecha_limite', { ascending: true }),
        supabase
          .from('actuaciones_procesales')
          .select('*')
          .order('fecha', { ascending: false })
          .order('fecha_creacion', { ascending: false }),
      ]);

      if (expRes.error) throw expRes.error;
      if (plazosRes.error) throw plazosRes.error;
      if (actRes.error) throw actRes.error;

      const expedientes = ((expRes.data || []) as ExpedienteRow[]).map(mapRowToExpediente);
      const plazos = ordenarPlazosCronologicamente(
        ((plazosRes.data || []) as PlazoRow[]).map(mapRowToPlazo)
      );
      const actuaciones = ordenarActuacionesDescendente(
        ((actRes.data || []) as ActuacionRow[]).map(mapRowToActuacion)
      );

      return { expedientes, plazos, actuaciones };
    } catch (err) {
      lastError = err;
      const errObj =
        typeof err === 'object' && err !== null ? (err as { code?: unknown }) : {};
      const code = String(errObj.code || '');
      // No reintentar errores deterministas de esquema/permisos
      if (code === 'PGRST205' || code === '42501') {
        throw err;
      }
      if (intento < retries) {
        await new Promise((resolve) => setTimeout(resolve, 350 * (intento + 1)));
      }
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    res.json({
      ok: true,
      supabaseConfigured: Boolean(supabase),
    });
  });

  app.get('/api/bootstrap', async (_req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.json({
        mode: 'local',
        expedientes: [],
        plazos: [],
        actuaciones: [],
      });
    }

    try {
      const dataset = await fetchFullDatasetWithRetry(supabase);
      return res.json({
        mode: 'supabase',
        ...dataset,
      });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Supabase bootstrap notice:', parsed.error);
      return res.status(200).json({
        mode: 'supabase',
        expedientes: [],
        plazos: [],
        actuaciones: [],
        ...parsed,
      });
    }
  });

  app.post('/api/sync-local', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    try {
      const { count, error: countErr } = await supabase
        .from('expedientes')
        .select('*', { count: 'exact', head: true });

      if (countErr) throw countErr;

      if ((count ?? 0) === 0) {
        const localExpedientes = Array.isArray(req.body?.expedientes)
          ? (req.body.expedientes as Expediente[])
          : [];
        const localPlazos = Array.isArray(req.body?.plazos)
          ? (req.body.plazos as PlazoProcesal[])
          : [];
        const localActuaciones = Array.isArray(req.body?.actuaciones)
          ? (req.body.actuaciones as ActuacionProcesal[])
          : [];

        if (localExpedientes.length > 0) {
          const { error: insExpErr } = await supabase
            .from('expedientes')
            .upsert(localExpedientes.map(mapExpedienteToRow), { onConflict: 'id' });
          if (insExpErr) throw insExpErr;

          const idsValidos = new Set(localExpedientes.map((e) => e.id));
          const plazosValidos = localPlazos.filter((p) => idsValidos.has(p.expedienteId));
          const actuacionesValidas = localActuaciones.filter((a) =>
            idsValidos.has(a.expedienteId)
          );

          if (plazosValidos.length > 0) {
            const { error: insPlazoErr } = await supabase
              .from('plazos_procesales')
              .upsert(plazosValidos.map(mapPlazoToRow), { onConflict: 'id' });
            if (insPlazoErr) throw insPlazoErr;
          }

          if (actuacionesValidas.length > 0) {
            const { error: insActErr } = await supabase
              .from('actuaciones_procesales')
              .upsert(actuacionesValidas.map(mapActuacionToRow), { onConflict: 'id' });
            if (insActErr) throw insActErr;
          }
        }
      }

      const dataset = await fetchFullDatasetWithRetry(supabase);
      return res.json(dataset);
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Supabase sync-local notice:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.post('/api/expedientes', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const formData = req.body?.formData as ExpedienteFormData | undefined;
    const sesion = req.body?.sesion as { autenticado: boolean; email?: string } | undefined;

    if (!formData) {
      return res.status(400).json({ error: 'Datos del expediente requeridos.' });
    }

    const construido = construirNuevoExpediente(formData, sesion);
    if (!construido.exito || !construido.expediente) {
      return res.status(400).json({
        errores: construido.errores || {},
        error: construido.mensaje || 'Datos inválidos.',
      });
    }

    try {
      const row = mapExpedienteToRow(construido.expediente);
      const { data, error } = await supabase
        .from('expedientes')
        .insert(row)
        .select('*')
        .single();

      if (error) throw error;

      return res.status(201).json({
        expediente: mapRowToExpediente(data as ExpedienteRow),
      });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error creating expediente in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.patch('/api/expedientes/:id/tipo-proceso', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const { id } = req.params;
    const tipoProceso = req.body?.tipoProceso as TipoProcedimiento | undefined;
    if (
      tipoProceso !== 'penal' &&
      tipoProceso !== 'ordinario' &&
      tipoProceso !== 'sumario'
    ) {
      return res.status(400).json({ error: 'Tipo de procedimiento no válido.' });
    }

    try {
      const { data, error } = await supabase
        .from('expedientes')
        .update({ tipo_proceso: tipoProceso })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return res.json({ expediente: mapRowToExpediente(data as ExpedienteRow) });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error updating tipo_proceso in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.delete('/api/expedientes/:id', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const { id } = req.params;
    try {
      await supabase.from('plazos_procesales').delete().eq('expediente_id', id);
      await supabase.from('actuaciones_procesales').delete().eq('expediente_id', id);
      const { error } = await supabase.from('expedientes').delete().eq('id', id);
      if (error) throw error;

      return res.json({ ok: true });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error deleting expediente in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.delete('/api/expedientes', async (_req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    try {
      const { error: pErr } = await supabase
        .from('plazos_procesales')
        .delete()
        .not('id', 'is', null);
      if (pErr) throw pErr;

      const { error: aErr } = await supabase
        .from('actuaciones_procesales')
        .delete()
        .not('id', 'is', null);
      if (aErr) throw aErr;

      const { error: eErr } = await supabase
        .from('expedientes')
        .delete()
        .not('id', 'is', null);
      if (eErr) throw eErr;

      return res.json({ ok: true });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error clearing expedientes in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.post('/api/expedientes/:id/plazos', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const { id } = req.params;
    const formData = req.body as PlazoFormData | undefined;
    if (!formData) {
      return res.status(400).json({ error: 'Datos del plazo procesal requeridos.' });
    }

    try {
      const { data: expData, error: expErr } = await supabase
        .from('expedientes')
        .select('*')
        .eq('id', id)
        .single();

      if (expErr || !expData) {
        return res.status(404).json({ error: 'Expediente no encontrado.' });
      }

      const expediente = mapRowToExpediente(expData as ExpedienteRow);
      const construido = construirNuevoPlazo(expediente, formData);
      if (!construido.exito || !construido.plazo) {
        return res.status(400).json({
          errores: construido.errores || {},
          error: construido.mensaje || 'Datos de plazo inválidos.',
        });
      }

      const { data: inserted, error: insErr } = await supabase
        .from('plazos_procesales')
        .insert(mapPlazoToRow(construido.plazo))
        .select('*')
        .single();

      if (insErr) throw insErr;

      const { data: listData, error: listErr } = await supabase
        .from('plazos_procesales')
        .select('*')
        .eq('expediente_id', id)
        .order('fecha_limite', { ascending: true });

      if (listErr) throw listErr;

      return res.status(201).json({
        plazo: mapRowToPlazo(inserted as PlazoRow),
        plazosExpediente: ordenarPlazosCronologicamente(
          ((listData || []) as PlazoRow[]).map(mapRowToPlazo)
        ),
      });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error creating plazo in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.patch('/api/plazos/:id', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const { id } = req.params;
    const estado = req.body?.estado as EstadoPlazo | undefined;
    if (estado !== 'Pendiente' && estado !== 'Presentado/Cumplido') {
      return res.status(400).json({ error: 'Estado de plazo no válido.' });
    }

    try {
      const fechaCumplimiento =
        estado === 'Presentado/Cumplido' ? new Date().toISOString() : null;

      const { data, error } = await supabase
        .from('plazos_procesales')
        .update({
          estado,
          fecha_cumplimiento: fechaCumplimiento,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;
      return res.json({ plazo: mapRowToPlazo(data as PlazoRow) });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error updating plazo estado in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.delete('/api/plazos/:id', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const { id } = req.params;
    try {
      const { error } = await supabase.from('plazos_procesales').delete().eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error deleting plazo in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.post('/api/expedientes/:id/actuaciones', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const { id } = req.params;
    const formData = req.body as ActuacionFormData | undefined;
    if (!formData) {
      return res.status(400).json({ error: 'Datos de la actuación requeridos.' });
    }

    try {
      const { data: expData, error: expErr } = await supabase
        .from('expedientes')
        .select('id')
        .eq('id', id)
        .single();

      if (expErr || !expData) {
        return res.status(404).json({ error: 'Expediente no encontrado.' });
      }

      const construido = construirNuevaActuacion(id, formData);
      if (!construido.exito || !construido.actuacion) {
        return res.status(400).json({
          errores: construido.errores || {},
          error: construido.mensaje || 'Datos de actuación inválidos.',
        });
      }

      const { data: inserted, error: insErr } = await supabase
        .from('actuaciones_procesales')
        .insert(mapActuacionToRow(construido.actuacion))
        .select('*')
        .single();

      if (insErr) throw insErr;

      const { data: listData, error: listErr } = await supabase
        .from('actuaciones_procesales')
        .select('*')
        .eq('expediente_id', id)
        .order('fecha', { ascending: false })
        .order('fecha_creacion', { ascending: false });

      if (listErr) throw listErr;

      return res.status(201).json({
        actuacion: mapRowToActuacion(inserted as ActuacionRow),
        actuacionesExpediente: ordenarActuacionesDescendente(
          ((listData || []) as ActuacionRow[]).map(mapRowToActuacion)
        ),
      });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error creating actuacion in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  app.delete('/api/actuaciones/:id', async (req: Request, res: Response) => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return res.status(503).json({ error: 'Supabase no está configurado en el servidor.' });
    }

    const { id } = req.params;
    try {
      const { error } = await supabase
        .from('actuaciones_procesales')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return res.json({ ok: true });
    } catch (err) {
      const parsed = sanitizeDatabaseError(err);
      console.warn('Error deleting actuacion in Supabase:', parsed.error);
      return res.status(500).json(parsed);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`EXP-Legal server running on port ${port}`);
  });
}

startServer();
