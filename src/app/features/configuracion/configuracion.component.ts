import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { RolesService } from '../../core/services/roles.service';
import { ConfiguracionPrecios, Rol } from '../../core/models/models';

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  config: ConfiguracionPrecios = { precio_hora_normal: 0, precio_hora_extra: 0, horas_jornada_normal: 8 };
  roles = signal<Rol[]>([]);
  loading = signal(true);
  saving = signal(false);
  savingRole = signal(false);
  successMsg = signal('');
  error = signal('');

  // Role Modal state
  showRoleModal = signal(false);
  editingRole = signal<Rol | null>(null);
  roleForm: Rol = {
    nombre: '',
    descripcion: '',
    precio_hora_normal: 0,
    precio_hora_extra: 0,
    horas_jornada_normal: 10,
    hora_ingreso_predeterminada: '08:00',
    hora_salida_predeterminada: '19:00'
  };

  // Role Delete Confirm State
  showDeleteConfirm = signal(false);
  deletingRoleId = signal<string | null>(null);

  constructor(
    private cfgSvc: ConfiguracionService,
    private rolesSvc: RolesService
  ) {}

  async ngOnInit() {
    await this.loadAll();
  }

  async loadAll() {
    this.loading.set(true);
    try {
      const [cfg, rolesList] = await Promise.all([
        this.cfgSvc.get(),
        this.rolesSvc.getAll()
      ]);
      this.config = cfg;
      this.roles.set(rolesList);
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

  openNewRole() {
    this.roleForm = {
      nombre: '',
      descripcion: '',
      precio_hora_normal: 0,
      precio_hora_extra: 0,
      horas_jornada_normal: 10,
      hora_ingreso_predeterminada: '08:00',
      hora_salida_predeterminada: '19:00'
    };
    this.editingRole.set(null);
    this.error.set('');
    this.showRoleModal.set(true);
  }

  openEditRole(rol: Rol) {
    this.roleForm = { ...rol };
    this.editingRole.set(rol);
    this.error.set('');
    this.showRoleModal.set(true);
  }

  closeRoleModal() {
    this.showRoleModal.set(false);
    this.editingRole.set(null);
  }

  async saveRole() {
    if (!this.roleForm.nombre.trim()) {
      this.error.set('El nombre del rol es obligatorio (ej: Estampado, Máquina).');
      return;
    }
    if (this.roleForm.precio_hora_normal < 0 || this.roleForm.precio_hora_extra < 0) {
      this.error.set('Los precios por hora no pueden ser negativos.');
      return;
    }

    this.savingRole.set(true);
    this.error.set('');
    try {
      const editing = this.editingRole();
      if (editing?.id) {
        await this.rolesSvc.update(editing.id, this.roleForm);
        this.showSuccess('Rol actualizado correctamente.');
      } else {
        await this.rolesSvc.create(this.roleForm);
        this.showSuccess('Rol creado correctamente.');
      }
      this.closeRoleModal();
      await this.loadAll();
    } catch {
      this.error.set('Error al guardar el rol.');
    } finally {
      this.savingRole.set(false);
    }
  }

  confirmDeleteRole(id: string) {
    this.deletingRoleId.set(id);
    this.showDeleteConfirm.set(true);
  }

  cancelDeleteRole() {
    this.showDeleteConfirm.set(false);
    this.deletingRoleId.set(null);
  }

  async doDeleteRole() {
    const id = this.deletingRoleId();
    if (!id) return;
    try {
      await this.rolesSvc.delete(id);
      this.showSuccess('Rol eliminado correctamente.');
      this.cancelDeleteRole();
      await this.loadAll();
    } catch {
      this.error.set('Error al eliminar el rol. Puede estar asignado a un empleado.');
      this.cancelDeleteRole();
    }
  }

  showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 3000);
  }

  formatCurrency(val: number): string {
    return `S/. ${(val || 0).toFixed(2)}`;
  }
}
