-- ============================================================
-- SCRIPT DE MIGRACIÓN SEGURO (SIN INSERCIONES DE DATOS)
-- Ejecuta este script en: Supabase → SQL Editor → New Query → Run
-- NO borra ni altera datos de las tablas existentes.
-- NO incluye ningún 'INSERT INTO' (agrega tus datos desde la App o Supabase)
-- ============================================================

-- 1. AGREGAR COLUMNAS FALTANTES A TABLAS EXISTENTES (Si no existen)
ALTER TABLE roles ADD COLUMN IF NOT EXISTS hora_ingreso_predeterminada TIME DEFAULT '08:00';
ALTER TABLE roles ADD COLUMN IF NOT EXISTS hora_salida_predeterminada TIME DEFAULT '19:00';
ALTER TABLE roles ALTER COLUMN horas_jornada_normal SET DEFAULT 10;

ALTER TABLE empleados ADD COLUMN IF NOT EXISTS rol_id UUID REFERENCES roles(id) ON DELETE SET NULL;

ALTER TABLE configuracion_precios ALTER COLUMN horas_jornada_normal SET DEFAULT 10;

-- 2. CREACIÓN DE TABLAS (Solo las crea si aún no existen)
CREATE TABLE IF NOT EXISTS roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT DEFAULT '',
  precio_hora_normal DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_hora_extra DECIMAL(10,2) NOT NULL DEFAULT 0,
  horas_jornada_normal INTEGER NOT NULL DEFAULT 10,
  hora_ingreso_predeterminada TIME DEFAULT '08:00',
  hora_salida_predeterminada TIME DEFAULT '19:00',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS empleados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cargo TEXT DEFAULT '',
  rol_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registros_horas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empleado_id UUID NOT NULL REFERENCES empleados(id) ON DELETE RESTRICT,
  fecha DATE NOT NULL,
  hora_entrada TIME NOT NULL,
  hora_salida TIME,
  horas_normales DECIMAL(5,2) DEFAULT 0,
  horas_extras DECIMAL(5,2) DEFAULT 0,
  costo_normal DECIMAL(10,2) DEFAULT 0,
  costo_extra DECIMAL(10,2) DEFAULT 0,
  costo_total DECIMAL(10,2) DEFAULT 0,
  observaciones TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS configuracion_precios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  precio_hora_normal DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_hora_extra DECIMAL(10,2) NOT NULL DEFAULT 0,
  horas_jornada_normal INTEGER NOT NULL DEFAULT 10,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_precios ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access roles') THEN
        CREATE POLICY "Auth full access roles" ON roles FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access empleados') THEN
        CREATE POLICY "Auth full access empleados" ON empleados FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access registros') THEN
        CREATE POLICY "Auth full access registros" ON registros_horas FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Auth full access config') THEN
        CREATE POLICY "Auth full access config" ON configuracion_precios FOR ALL TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
