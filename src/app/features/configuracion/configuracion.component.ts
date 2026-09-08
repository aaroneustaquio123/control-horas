import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { ConfiguracionPrecios } from '../../core/models/models';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  config: ConfiguracionPrecios = { precio_hora_normal: 0, precio_hora_extra: 0, horas_jornada_normal: 8 };
  loading = signal(true);
  saving = signal(false);
  successMsg = signal('');
  error = signal('');

  constructor(private svc: ConfiguracionService) {}

  async ngOnInit() {
    try {
      this.config = await this.svc.get();
    } finally {
      this.loading.set(false);
    }
  }

  async save() {
    if (this.config.precio_hora_normal < 0 || this.config.precio_hora_extra < 0) {
      this.error.set('Los precios no pueden ser negativos.');
      return;
    }
    if (this.config.horas_jornada_normal < 1 || this.config.horas_jornada_normal > 24) {
      this.error.set('La jornada normal debe estar entre 1 y 24 horas.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      await this.svc.save(this.config);
      this.successMsg.set('Configuración guardada correctamente.');
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch {
      this.error.set('Error al guardar la configuración.');
    } finally {
      this.saving.set(false);
    }
  }

  exampleNormal(): string {
    const val = 8 * (this.config.precio_hora_normal || 0);
    return val.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
  }

  exampleExtra(): string {
    const val = 2 * (this.config.precio_hora_extra || 0);
    return val.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
  }
}
