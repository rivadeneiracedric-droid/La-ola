-- Esquema relacional para EXP-Legal (La Ola) en Supabase (PostgreSQL)
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase.

CREATE TABLE IF NOT EXISTS public.expedientes (
  id UUID PRIMARY KEY,
  codigo_interno TEXT NOT NULL UNIQUE,
  numero_proceso TEXT,
  titulo TEXT NOT NULL,
  cliente TEXT NOT NULL,
  materia TEXT NOT NULL CHECK (materia IN ('civil', 'laboral', 'penal', 'administrativa', 'otra')),
  materia_otra TEXT,
  tipo_proceso TEXT CHECK (tipo_proceso IS NULL OR tipo_proceso IN ('penal', 'ordinario', 'sumario')),
  tipo_asunto TEXT,
  bitacora TEXT,
  responsable TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Abierto' CHECK (estado = 'Abierto'),
  fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  creador JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS public.plazos_procesales (
  id UUID PRIMARY KEY,
  expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  procedimiento TEXT CHECK (procedimiento IS NULL OR procedimiento IN ('penal', 'ordinario', 'sumario')),
  fecha_limite TIMESTAMPTZ NOT NULL,
  descripcion TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN ('Pendiente', 'Presentado/Cumplido')),
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_cumplimiento TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.actuaciones_procesales (
  id UUID PRIMARY KEY,
  expediente_id UUID NOT NULL REFERENCES public.expedientes(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('Providencia/Auto', 'Audiencia', 'Escrito ingresado', 'Reunión con cliente', 'Otro')),
  detalle TEXT NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expedientes_fecha_apertura
  ON public.expedientes (fecha_apertura DESC);

CREATE INDEX IF NOT EXISTS idx_plazos_expediente_fecha
  ON public.plazos_procesales (expediente_id, fecha_limite ASC);

CREATE INDEX IF NOT EXISTS idx_actuaciones_expediente_fecha
  ON public.actuaciones_procesales (expediente_id, fecha DESC, fecha_creacion DESC);

ALTER TABLE public.expedientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plazos_procesales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.actuaciones_procesales ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'expedientes' AND policyname = 'expedientes_all_access'
  ) THEN
    CREATE POLICY expedientes_all_access ON public.expedientes
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'plazos_procesales' AND policyname = 'plazos_all_access'
  ) THEN
    CREATE POLICY plazos_all_access ON public.plazos_procesales
      FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'actuaciones_procesales' AND policyname = 'actuaciones_all_access'
  ) THEN
    CREATE POLICY actuaciones_all_access ON public.actuaciones_procesales
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
