import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Rol } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private TABLE = 'roles';

  constructor(private sb: SupabaseService) {}

  async getAll(): Promise<Rol[]> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .order('nombre', { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<Rol | null> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async create(rol: Omit<Rol, 'id' | 'created_at'>): Promise<Rol> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .insert(rol)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async update(id: string, rol: Partial<Rol>): Promise<Rol> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .update(rol)
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
