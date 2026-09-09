import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Cotizacion } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CotizacionesService {
  private TABLE = 'cotizaciones';

  constructor(private sb: SupabaseService) {}

  async getAll(): Promise<Cotizacion[]> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data ?? [];
  }

  async getById(id: string): Promise<Cotizacion | null> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  async create(cotizacion: Omit<Cotizacion, 'id' | 'created_at'>): Promise<Cotizacion> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .insert(cotizacion)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, cotizacion: Partial<Cotizacion>): Promise<Cotizacion> {
    const { data, error } = await this.sb.client
      .from(this.TABLE)
      .update(cotizacion)
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

  calcularCotizacion(input: {
    cantidad: number;
    costo_tela: number;
    costo_estampado: number;
    costo_confeccion: number;
    costo_acabado: number;
    costo_otros: number;
    margen_ganancia: number;
  }): {
    costo_unitario: number;
    costo_total: number;
    precio_venta_unitario: number;
    precio_venta_total: number;
    ganancia_estimada: number;
  } {
    const cant = Math.max(1, input.cantidad || 1);
    const costoUnitario = 
      (input.costo_tela || 0) +
      (input.costo_estampado || 0) +
      (input.costo_confeccion || 0) +
      (input.costo_acabado || 0) +
      (input.costo_otros || 0);

    const costoTotal = costoUnitario * cant;

    const porcentajeMargen = (input.margen_ganancia || 0) / 100;
    // Precio de venta = Costo / (1 - %Margen)  o Costo * (1 + %Margen)
    // Usamos marcado estándar: Costo * (1 + Margen)
    const precioVentaUnitario = costoUnitario * (1 + porcentajeMargen);
    const precioVentaTotal = precioVentaUnitario * cant;
    const gananciaEstimada = precioVentaTotal - costoTotal;

    return {
      costo_unitario: Math.round(costoUnitario * 100) / 100,
      costo_total: Math.round(costoTotal * 100) / 100,
      precio_venta_unitario: Math.round(precioVentaUnitario * 100) / 100,
      precio_venta_total: Math.round(precioVentaTotal * 100) / 100,
      ganancia_estimada: Math.round(gananciaEstimada * 100) / 100
    };
  }
}
