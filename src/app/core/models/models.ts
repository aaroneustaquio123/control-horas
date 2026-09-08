export interface Rol {
  id?: string;
  nombre: string;
  descripcion?: string;
  precio_hora_normal: number;
  precio_hora_extra: number;
  horas_jornada_normal: number;
  hora_ingreso_predeterminada?: string;
  hora_salida_predeterminada?: string;
  created_at?: string;
}

export interface Empleado {
  id?: string;
  nombre: string;
  apellido: string;
  cargo: string;
  rol_id?: string | null;
  rol?: Rol;
  activo: boolean;
  created_at?: string;
}

export interface RegistroHoras {
  id?: string;
  empleado_id: string;
  empleado?: Empleado;
  fecha: string;
  hora_entrada: string;
  hora_salida: string | null;
  horas_normales?: number;
  horas_extras?: number;
  costo_normal?: number;
  costo_extra?: number;
  costo_total?: number;
  observaciones?: string;
  created_at?: string;
}

export interface ConfiguracionPrecios {
  id?: string;
  precio_hora_normal: number;
  precio_hora_extra: number;
  horas_jornada_normal: number;
  updated_at?: string;
}

export interface ResumenEmpleado {
  empleado: Empleado;
  total_horas_normales: number;
  total_horas_extras: number;
  total_costo: number;
  dias_trabajados: number;
}
