import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal('');
  showPassword = signal(false);
  isConfigured: boolean;

  constructor(private auth: AuthService, private router: Router) {
    this.isConfigured = this.auth.isSupabaseConfigured;
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Por favor ingresa tu correo y contraseña.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.signIn(this.email, this.password);
      this.router.navigate(['/dashboard']);
    } catch (err: any) {
      this.error.set('Credenciales incorrectas. Verifica tu correo y contraseña.');
    } finally {
      this.loading.set(false);
    }
  }

  togglePassword() {
    this.showPassword.set(!this.showPassword());
  }
}
