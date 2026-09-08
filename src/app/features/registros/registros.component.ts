import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { RegistrosService } from '../../core/services/registros.service';
import { EmpleadosService } from '../../core/services/empleados.service';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { RegistroHoras, Empleado, ConfiguracionPrecios } from '../../core/models/models';

@Component({
  selector: 'app-registros',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './registros.component.html',
  styleUrl: './registros.component.css'
})
export class RegistrosComponent implements OnInit {
  registros = signal<RegistroHoras[]>([]);
  empleados = signal<Empleado[]>([]);
  config = signal<ConfiguracionPrecios>({ precio_hora_normal: 0, precio_hora_extra: 0, horas_jornada_normal: 8 });
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  successMsg = signal('');
  showModal = signal(false);
  editingId = signal<string | null>(null);
  showDeleteConfirm = signal(false);
  deletingId = signal<string | null>(null);

  // Filters
  filtroFechaInicio = signal('');
  filtroFechaFin = signal('');
  filtroEmpleado = signal('');

  // Form
  form: Partial<RegistroHoras> = {};
  preview = signal<{ horas_normales: number; horas_extras: number; costo_normal: number; costo_extra: number; costo_total: number } | null>(null);

  constructor(
    private regSvc: RegistrosService,
    private empSvc: EmpleadosService,
    private cfgSvc: ConfiguracionService
  ) {}

  async ngOnInit() {
    const [empleados, config] = await Promise.all([
      this.empSvc.getActivos(),
      this.cfgSvc.get()
    ]);
    this.empleados.set(empleados);
    this.config.set(config);
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const data = await this.regSvc.getAll(
        this.filtroFechaInicio() || undefined,
        this.filtroFechaFin() || undefined
      );
      let filtered = data;
      if (this.filtroEmpleado()) {
        filtered = data.filter(r => r.empleado_id === this.filtroEmpleado());
      }
      this.registros.set(filtered);
    } finally {
      this.loading.set(false);
    }
  }

  async applyFilters() {
    await this.load();
  }

  clearFilters() {
    this.filtroFechaInicio.set('');
    this.filtroFechaFin.set('');
    this.filtroEmpleado.set('');
    this.load();
  }

  openNew() {
    this.form = { fecha: new Date().toISOString().split('T')[0], hora_entrada: '', hora_salida: null, empleado_id: '', observaciones: '' };
    this.editingId.set(null);
    this.preview.set(null);
    this.error.set('');
    this.showModal.set(true);
  }

  async openEdit(registro: RegistroHoras) {
    this.form = { ...registro };
    this.editingId.set(registro.id ?? null);
    this.error.set('');
    this.updatePreview();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.preview.set(null);
  }

  updatePreview() {
    const { hora_entrada, hora_salida } = this.form;
    if (hora_entrada && hora_salida) {
      const cfg = this.config();
      const calc = this.regSvc.calcularHoras(hora_entrada, hora_salida as string, cfg.horas_jornada_normal);
      const costo_normal = calc.horas_normales * cfg.precio_hora_normal;
      const costo_extra = calc.horas_extras * cfg.precio_hora_extra;
      this.preview.set({
        horas_normales: calc.horas_normales,
        horas_extras: calc.horas_extras,
        costo_normal: Math.round(costo_normal * 100) / 100,
        costo_extra: Math.round(costo_extra * 100) / 100,
        costo_total: Math.round((costo_normal + costo_extra) * 100) / 100
      });
    } else {
      this.preview.set(null);
    }
  }

  async save() {
    if (!this.form.empleado_id || !this.form.fecha || !this.form.hora_entrada) {
      this.error.set('Empleado, fecha y hora de entrada son obligatorios.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      const cfg = this.config();
      let horas_normales = 0, horas_extras = 0;
      if (this.form.hora_salida) {
        const calc = this.regSvc.calcularHoras(this.form.hora_entrada!, this.form.hora_salida, cfg.horas_jornada_normal);
        horas_normales = calc.horas_normales;
        horas_extras = calc.horas_extras;
      }
      const payload: Omit<RegistroHoras, 'id' | 'created_at' | 'empleado'> = {
        empleado_id: this.form.empleado_id!,
        fecha: this.form.fecha!,
        hora_entrada: this.form.hora_entrada!,
        hora_salida: this.form.hora_salida ?? null,
        horas_normales,
        horas_extras,
        costo_normal: horas_normales * cfg.precio_hora_normal,
        costo_extra: horas_extras * cfg.precio_hora_extra,
        costo_total: horas_normales * cfg.precio_hora_normal + horas_extras * cfg.precio_hora_extra,
        observaciones: this.form.observaciones ?? ''
      };
      if (this.editingId()) {
        await this.regSvc.update(this.editingId()!, payload);
        this.showSuccess('Registro actualizado.');
      } else {
        await this.regSvc.create(payload);
        this.showSuccess('Registro guardado correctamente.');
      }
      this.closeModal();
      await this.load();
    } catch (e: any) {
      this.error.set('Error al guardar. Intenta de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }

  confirmDelete(id: string) {
    this.deletingId.set(id);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
    this.deletingId.set(null);
  }

  async doDelete() {
    const id = this.deletingId();
    if (!id) return;
    try {
      await this.regSvc.delete(id);
      this.showSuccess('Registro eliminado.');
      this.cancelDelete();
      await this.load();
    } catch {
      this.error.set('Error al eliminar.');
      this.cancelDelete();
    }
  }

  showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  formatHora(t: string | null): string {
    if (!t) return '—';
    return t.substring(0, 5);
  }

  formatCurrency(val: number): string {
    return val.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' });
  }

  nombreEmpleado(id: string): string {
    const e = this.empleados().find(emp => emp.id === id);
    return e ? `${e.nombre} ${e.apellido}` : '—';
  }

  initials(r: RegistroHoras): string {
    const e = r.empleado;
    if (!e) return '?';
    return `${e.nombre?.[0] ?? ''}${e.apellido?.[0] ?? ''}`.toUpperCase();
  }
}
