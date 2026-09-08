import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { RegistroHoras } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RegistrosService {
  private TABLE = 'registros_horas';

  constructor(private sb: SupabaseService) {}

  async getAll(fechaInicio?: string, fechaFin?: string): Promise<RegistroHoras[]> {
    let query = this.sb.client
      .from(this.TABLE)
      .select(`*, empleado:empleados(*, rol:roles(*))`)
      .order('fecha', { ascending: false })
      .order('created_at', { ascending: false });

    if (fechaInicio) query = query.gte('fecha', fechaInicio);
    if (fechaFin) query = query.lte('fecha', fechaFin);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getByEmpleado(empleadoId: string, fechaInicio?: string, fechaFin?: string): Promise<RegistroHoras[]> {
    let query = this.sb.client
      .from(this.TABLE)
      .select(`*, empleado:empleados(*, rol:roles(*))`)
      .eq('empleado_id', empleadoId)
      .order('fecha', { ascending: false });

    if (fechaInicio) query = query.gte('fecha', fechaInicio);
    if (fechaFin) query = query.lte('fecha', fechaFin);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<RegistroHoras | null> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select(`*, empleado:empleados(*)`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(registro: Omit<RegistroHoras, 'id' | 'created_at' | 'empleado'>): Promise<RegistroHoras> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .insert(registro)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, registro: Partial<RegistroHoras>): Promise<RegistroHoras> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .update(registro)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.sb.client
      .from(this.TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
  }

  calcularHoras(horaEntrada: string, horaSalida: string, jornadaNormal: number = 10): {
    horas_normales: number;
    horas_extras: number;
  } {
    const [hE, mE] = horaEntrada.split(':').map(Number);
    const [hS, mS] = horaSalida.split(':').map(Number);

    const minEntrada = hE * 60 + mE;
    const minSalida = hS * 60 + mS;
    const totalMinutosReloj = Math.max(0, minSalida - minEntrada);

    // Descuento de 1 hora de refrigerio (1:00 PM a 2:00 PM = 13:00 a 14:00 = 780 a 840 min)
    const inicioAlmuerzo = 13 * 60; // 780 min
    const finAlmuerzo = 14 * 60;    // 840 min
    const overlapAlmuerzo = Math.max(0, Math.min(minSalida, finAlmuerzo) - Math.max(minEntrada, inicioAlmuerzo));

    const minutosEfectivos = Math.max(0, totalMinutosReloj - overlapAlmuerzo);
    const totalHorasEfectivas = minutosEfectivos / 60;

    const horas_normales = Math.min(totalHorasEfectivas, jornadaNormal);
    const horas_extras = Math.max(0, totalHorasEfectivas - jornadaNormal);

    return {
      horas_normales: Math.round(horas_normales * 100) / 100,
      horas_extras: Math.round(horas_extras * 100) / 100
    };
  }
}
