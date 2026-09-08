import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ConfiguracionPrecios } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ConfiguracionService {
  private TABLE = 'configuracion_precios';

  constructor(private sb: SupabaseService) {}

  async get(): Promise<ConfiguracionPrecios> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .limit(1)
      .single();

    if (error || !data) {
      // Return defaults if not configured yet
      return { precio_hora_normal: 0, precio_hora_extra: 0, horas_jornada_normal: 8 };
    }
    return data;
  }

  async save(config: Omit<ConfiguracionPrecios, 'id' | 'updated_at'>): Promise<ConfiguracionPrecios> {
    // Check if record exists
    const { data: existing } = await this.sb.client
      .from(this.TABLE)
      .select('id')
      .limit(1)
      .single();

    if (existing?.id) {
      // Update existing
      const { data, error } = await this.sb.client
        .from(this.TABLE)
        .update({ ...config, updated_at: new Date().toISOString() })
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      // Insert new
      const { data, error } = await this.sb.client
        .from(this.TABLE)
        .insert(config)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  }
}
