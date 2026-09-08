import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Empleado } from '../models/models';

@Injectable({ providedIn: 'root' })
export class EmpleadosService {
  private TABLE = 'empleados';

  constructor(private sb: SupabaseService) {}

  async getAll(): Promise<Empleado[]> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async getActivos(): Promise<Empleado[]> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .eq('activo', true)
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<Empleado | null> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(empleado: Omit<Empleado, 'id' | 'created_at'>): Promise<Empleado> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .insert(empleado)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, empleado: Partial<Empleado>): Promise<Empleado> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .update(empleado)
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
}
