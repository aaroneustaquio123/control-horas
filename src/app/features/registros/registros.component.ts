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
  selectedEmpleado = signal<Empleado | null>(null);
  preview = signal<{ horas_normales: number; horas_extras: number; costo_normal: number; costo_extra: number; costo_total: number } | null>(null);

  constructor(
    private regSvc: RegistrosService,
    private empSvc: EmpleadosService,
    private cfgSvc: ConfiguracionService
  ) {}

  async ngOnInit() {
    const [empleadosData, configData] = await Promise.all([
      this.empSvc.getActivos(),
      this.cfgSvc.get()
    ]);
    this.empleados.set(empleadosData);
    this.config.set(configData);
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
    this.selectedEmpleado.set(null);
    this.preview.set(null);
    this.error.set('');
    this.showModal.set(true);
  }

  async openEdit(registro: RegistroHoras) {
    this.form = { ...registro };
    this.editingId.set(registro.id ?? null);
    const emp = this.empleados().find(e => e.id === registro.empleado_id) ?? null;
    this.selectedEmpleado.set(emp);
    this.error.set('');
    this.updatePreview();
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingId.set(null);
    this.selectedEmpleado.set(null);
    this.preview.set(null);
  }

  onEmpleadoSelect() {
    const empId = this.form.empleado_id;
    const emp = this.empleados().find(e => e.id === empId) ?? null;
    this.selectedEmpleado.set(emp);

    if (emp?.rol) {
      // Auto-fill default role schedule if creating a new entry
      if (!this.editingId()) {
        this.form.hora_entrada = emp.rol.hora_ingreso_predeterminada || '08:00';
        this.form.hora_salida = emp.rol.hora_salida_predeterminada || '19:00';
      }
    }
    this.updatePreview();
  }

  getTarifasActuales(): { precioNormal: number; precioExtra: number; jornadaNormal: number } {
    const emp = this.selectedEmpleado();
    const cfg = this.config();
    if (emp?.rol) {
      return {
        precioNormal: emp.rol.precio_hora_normal,
        precioExtra: emp.rol.precio_hora_extra,
        jornadaNormal: emp.rol.horas_jornada_normal
      };
    }
    return {
      precioNormal: cfg.precio_hora_normal,
      precioExtra: cfg.precio_hora_extra,
      jornadaNormal: cfg.horas_jornada_normal
    };
  }

  updatePreview() {
    const { hora_entrada, hora_salida } = this.form;
    if (hora_entrada && hora_salida) {
      const { precioNormal, precioExtra, jornadaNormal } = this.getTarifasActuales();
      const calc = this.regSvc.calcularHoras(hora_entrada, hora_salida as string, jornadaNormal);
      const costo_normal = calc.horas_normales * precioNormal;
      const costo_extra = calc.horas_extras * precioExtra;
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
      const { precioNormal, precioExtra, jornadaNormal } = this.getTarifasActuales();
      let horas_normales = 0, horas_extras = 0;
      if (this.form.hora_salida) {
        const calc = this.regSvc.calcularHoras(this.form.hora_entrada!, this.form.hora_salida, jornadaNormal);
        horas_normales = calc.horas_normales;
        horas_extras = calc.horas_extras;
      }
      const costo_normal = Math.round(horas_normales * precioNormal * 100) / 100;
      const costo_extra = Math.round(horas_extras * precioExtra * 100) / 100;

      const payload: Omit<RegistroHoras, 'id' | 'created_at' | 'empleado'> = {
        empleado_id: this.form.empleado_id!,
        fecha: this.form.fecha!,
        hora_entrada: this.form.hora_entrada!,
        hora_salida: this.form.hora_salida ?? null,
        horas_normales,
        horas_extras,
        costo_normal,
        costo_extra,
        costo_total: Math.round((costo_normal + costo_extra) * 100) / 100,
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
    return `S/. ${(val || 0).toFixed(2)}`;
  }

  exportExcel() {
    const headers = ['Empleado', 'Rol', 'Fecha', 'Hora Entrada', 'Hora Salida', 'Horas Normales', 'Horas Extras', 'Pago Normal (S/)', 'Pago Extra (S/)', 'Total a Pagar (S/)'];
    const rows = this.registros().map(r => [
      `"${(r.empleado?.nombre || '') + ' ' + (r.empleado?.apellido || '')}"`,
      `"${r.empleado?.rol?.nombre || 'General'}"`,
      r.fecha,
      r.hora_entrada,
      r.hora_salida || 'Pendiente',
      r.horas_normales || 0,
      r.horas_extras || 0,
      (r.costo_normal || 0).toFixed(2),
      (r.costo_extra || 0).toFixed(2),
      (r.costo_total || 0).toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Control_Horas_Pagos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printPDF() {
    window.print();
  }

  nombreEmpleado(id: string): string {
    const e = this.empleados().find(emp => emp.id === id);
    return e ? `${e.nombre} ${e.apellido}` : '—';
  }

  rolEmpleado(r: RegistroHoras): string {
    return r.empleado?.rol?.nombre ?? 'General';
  }

  initials(r: RegistroHoras): string {
    const e = r.empleado;
    if (!e) return '?';
    return `${e.nombre?.[0] ?? ''}${e.apellido?.[0] ?? ''}`.toUpperCase();
  }
}
