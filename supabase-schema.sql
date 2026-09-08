-- ============================================================
-- CONTROL DE HORAS - Esquema de base de datos Supabase
-- Ejecuta este SQL en: Supabase → SQL Editor → New Query
-- ============================================================

-- 1. Tabla de empleados
CREATE TABLE IF NOT EXISTS empleados (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  cargo TEXT DEFAULT '',
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de registros de horas
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

-- 3. Tabla de configuración de precios
CREATE TABLE IF NOT EXISTS configuracion_precios (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  precio_hora_normal DECIMAL(10,2) NOT NULL DEFAULT 0,
  precio_hora_extra DECIMAL(10,2) NOT NULL DEFAULT 0,
  horas_jornada_normal INTEGER NOT NULL DEFAULT 8,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar configuración inicial
INSERT INTO configuracion_precios (precio_hora_normal, precio_hora_extra, horas_jornada_normal)
VALUES (0, 0, 8)
ON CONFLICT DO NOTHING;

-- ============================================================
-- SEGURIDAD: Row Level Security (RLS)
-- Solo usuarios autenticados pueden acceder a los datos
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE empleados ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_precios ENABLE ROW LEVEL SECURITY;

-- Políticas: solo usuarios autenticados (admin) tienen acceso total
CREATE POLICY "Authenticated users can do everything on empleados"
ON empleados FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on registros_horas"
ON registros_horas FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can do everything on configuracion_precios"
ON configuracion_precios FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================================
-- DATOS DE EJEMPLO (opcional, eliminar en producción)
-- ============================================================
/*
INSERT INTO empleados (nombre, apellido, cargo) VALUES
  ('María', 'García', 'Vendedora'),
  ('Ana', 'López', 'Cajera'),
  ('Carmen', 'Martínez', 'Limpieza');
*/
