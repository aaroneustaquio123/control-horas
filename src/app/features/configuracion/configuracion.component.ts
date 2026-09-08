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
  config: ConfiguracionPrecios = { precio_hora_normal: 0, precio_hora_extra: 0, horas_jornada_normal: 10 };
  loading = signal(true);
  saving = signal(false);
  successMsg = signal('');
  error = signal('');

  constructor(private cfgSvc: ConfiguracionService) {}

  async ngOnInit() {
    await this.loadConfig();
  }

  async loadConfig() {
    this.loading.set(true);
    try {
      this.config = await this.cfgSvc.get();
    } catch {
      this.error.set('Error al cargar la configuración general.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveConfig() {
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
      await this.cfgSvc.save(this.config);
      this.showSuccess('Configuración general guardada correctamente.');
    } catch {
      this.error.set('Error al guardar la configuración.');
    } finally {
      this.saving.set(false);
    }
  }

  showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }
}
