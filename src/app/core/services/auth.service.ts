import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase.service';
import { AuthSession } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class AuthService {
  session = signal<AuthSession | null>(null);

  constructor(private sb: SupabaseService, private router: Router) {
    // Restore session on init
    this.sb.client.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
    });

    // Listen to auth state changes
    this.sb.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
      if (!session) {
        this.router.navigate(['/login']);
      }
    });
  }

  get isLoggedIn(): boolean {
    return !!this.session();
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.sb.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.sb.client.auth.signOut();
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return this.session()?.access_token ?? null;
  }
}
