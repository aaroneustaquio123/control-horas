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
      .select(`*, empleado:empleados(*)`)
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
      .select(`*, empleado:empleados(*)`)
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

  calcularHoras(horaEntrada: string, horaSalida: string, jornadaNormal: number): {
    horas_normales: number;
    horas_extras: number;
  } {
    const [hE, mE] = horaEntrada.split(':').map(Number);
    const [hS, mS] = horaSalida.split(':').map(Number);
    const totalMinutos = (hS * 60 + mS) - (hE * 60 + mE);
    const totalHoras = Math.max(0, totalMinutos / 60);
    const horas_normales = Math.min(totalHoras, jornadaNormal);
    const horas_extras = Math.max(0, totalHoras - jornadaNormal);
    return {
      horas_normales: Math.round(horas_normales * 100) / 100,
      horas_extras: Math.round(horas_extras * 100) / 100
    };
  }
}
