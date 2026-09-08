import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Injectable } from '@angular/core';

// 👇 Reemplaza estos valores con los de tu proyecto Supabase
// Los encuentras en: Supabase → Settings → API
const SUPABASE_URL = 'TU_SUPABASE_URL_AQUI';
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
