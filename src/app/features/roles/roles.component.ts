import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RolesService } from '../../core/services/roles.service';
import { Rol } from '../../core/models/models';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.component.html',
  styleUrl: './roles.component.css'
})
export class RolesComponent implements OnInit {
  roles = signal<Rol[]>([]);
  loading = signal(true);
  savingRole = signal(false);
  error = signal('');
  successMsg = signal('');

  // Modal state
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

  // Delete modal state
  showDeleteConfirm = signal(false);
  deletingRoleId = signal<string | null>(null);

  constructor(private rolesSvc: RolesService) {}

  ngOnInit() {
    this.loadRoles();
  }

  async loadRoles() {
    this.loading.set(true);
    try {
      const data = await this.rolesSvc.getAll();
      this.roles.set(data);
    } catch (err: any) {
      this.error.set('Error al cargar la lista de roles.');
    } finally {
      this.loading.set(false);
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
      this.error.set('El nombre del rol es obligatorio.');
      return;
    }

    if (this.roleForm.precio_hora_normal < 0 || this.roleForm.precio_hora_extra < 0) {
      this.error.set('Los precios por hora no pueden ser negativos.');
      return;
    }

    this.savingRole.set(true);
    this.error.set('');
    try {
      const isEditing = !!this.editingRole();
      if (isEditing && this.editingRole()?.id) {
        await this.rolesSvc.update(this.editingRole()!.id!, this.roleForm);
        this.showSuccess('Rol actualizado correctamente');
      } else {
        await this.rolesSvc.create(this.roleForm);
        this.showSuccess('Rol creado correctamente');
      }
      this.closeRoleModal();
      await this.loadRoles();
    } catch (err: any) {
      this.error.set('Error al guardar el rol. Verifica los datos.');
    } finally {
      this.savingRole.set(false);
    }
  }

  confirmDeleteRole(id: string) {
    this.deletingRoleId.set(id);
    this.showDeleteConfirm.set(true);
  }

  cancelDelete() {
    this.showDeleteConfirm.set(false);
    this.deletingRoleId.set(null);
  }

  async deleteRole() {
    const id = this.deletingRoleId();
    if (!id) return;
    try {
      await this.rolesSvc.delete(id);
      this.showSuccess('Rol eliminado correctamente');
      this.cancelDelete();
      await this.loadRoles();
    } catch (err: any) {
      this.error.set('No se pudo eliminar el rol. Puede estar en uso.');
      this.cancelDelete();
    }
  }

  formatCurrency(val: number): string {
    return `S/. ${val.toFixed(2)}`;
  }

  private showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
