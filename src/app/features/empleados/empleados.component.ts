import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { EmpleadosService } from '../../core/services/empleados.service';
import { RolesService } from '../../core/services/roles.service';
import { Empleado, Rol } from '../../core/models/models';

@Component({
  selector: 'app-empleados',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './empleados.component.html',
  styleUrl: './empleados.component.css'
})
export class EmpleadosComponent implements OnInit {
  empleados = signal<Empleado[]>([]);
  filteredEmpleados = signal<Empleado[]>([]);
  roles = signal<Rol[]>([]);
  loading = signal(true);
  searchTerm = signal('');
  showModal = signal(false);
  editingEmpleado = signal<Empleado | null>(null);
  saving = signal(false);
  error = signal('');
  successMsg = signal('');
  showDeleteConfirm = signal(false);
  deletingId = signal<string | null>(null);

  form: Empleado = { nombre: '', apellido: '', cargo: '', rol_id: null, activo: true };

  constructor(
    private svc: EmpleadosService,
    private rolesSvc: RolesService
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      const [empData, rolesData] = await Promise.all([
        this.svc.getAll(),
        this.rolesSvc.getAll()
      ]);
      this.empleados.set(empData);
      this.roles.set(rolesData);
      this.applyFilter();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter() {
    const term = this.searchTerm().toLowerCase();
    if (!term) {
      this.filteredEmpleados.set(this.empleados());
    } else {
      this.filteredEmpleados.set(
        this.empleados().filter(e =>
          `${e.nombre} ${e.apellido} ${e.cargo} ${e.rol?.nombre ?? ''}`.toLowerCase().includes(term)
        )
      );
    }
  }

  onSearch(event: any) {
    this.searchTerm.set(event.target.value);
    this.applyFilter();
  }

  openNew() {
    this.form = { nombre: '', apellido: '', cargo: '', rol_id: null, activo: true };
    this.editingEmpleado.set(null);
    this.error.set('');
    this.showModal.set(true);
  }

  openEdit(emp: Empleado) {
    this.form = { ...emp };
    this.editingEmpleado.set(emp);
    this.error.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingEmpleado.set(null);
  }

  async save() {
    if (!this.form.nombre.trim() || !this.form.apellido.trim()) {
      this.error.set('Nombre y apellido son obligatorios.');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    try {
      const editing = this.editingEmpleado();
      const payload = {
        nombre: this.form.nombre,
        apellido: this.form.apellido,
        cargo: this.form.cargo,
        rol_id: this.form.rol_id ? this.form.rol_id : null,
        activo: this.form.activo
      };

      if (editing?.id) {
        await this.svc.update(editing.id, payload);
        this.showSuccess('Empleado actualizado correctamente.');
      } else {
        await this.svc.create(payload);
        this.showSuccess('Empleado creado correctamente.');
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
      await this.svc.delete(id);
      this.showSuccess('Empleado eliminado.');
      this.cancelDelete();
      await this.load();
    } catch {
      this.error.set('Error al eliminar. El empleado puede tener registros asociados.');
      this.cancelDelete();
    }
  }

  async toggleActivo(emp: Empleado) {
    if (!emp.id) return;
    await this.svc.update(emp.id, { activo: !emp.activo });
    await this.load();
  }

  showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  initials(e: Empleado): string {
    return `${e.nombre[0] ?? ''}${e.apellido[0] ?? ''}`.toUpperCase();
  }

  formatCurrency(val?: number): string {
    if (!val && val !== 0) return '—';
    return `S/. ${val.toFixed(2)}`;
  }
}
