import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable } from '@angular/core';

// ============================================================
// 👇 IMPORTANTE: Reemplaza con tus claves reales de Supabase
// Las encuentras en: Supabase → Settings → API
// ============================================================
const SUPABASE_URL = 'https://earzhldunflrrnfieews.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhcnpobGR1bmZscnJuZmllZXdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4Nzg3MzEsImV4cCI6MjEwNDQ1NDczMX0.jGrZTXhYNzLz7vz76pJwcKbptIlUhF3yhUxIEeEQDTg';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase!: SupabaseClient;
  isConfigured = false;

  constructor() {
    const urlOk = SUPABASE_URL.startsWith('https://') && SUPABASE_URL.includes('.supabase.co');
    const keyOk = SUPABASE_KEY.length > 20 && !SUPABASE_KEY.includes('AQUI');

    if (urlOk && keyOk) {
      try {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
        this.isConfigured = true;
      } catch (e) {
        console.warn('Supabase: error al inicializar el cliente.', e);
      }
    } else {
      console.warn('⚠️ Supabase no configurado. Edita supabase.service.ts con tus claves reales.');
    }
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}

