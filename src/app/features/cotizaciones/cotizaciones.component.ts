import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CotizacionesService } from '../../core/services/cotizaciones.service';
import { Cotizacion } from '../../core/models/models';

@Component({
  selector: 'app-cotizaciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cotizaciones.component.html',
  styleUrl: './cotizaciones.component.css'
})
export class CotizacionesComponent implements OnInit {
  cotizaciones = signal<Cotizacion[]>([]);
  loading = signal(true);
  saving = signal(false);
  error = signal('');
  successMsg = signal('');

  // Modal state
  showModal = signal(false);
  editingItem = signal<Cotizacion | null>(null);

  form: Cotizacion = {
    nombre_modelo: '',
    descripcion: '',
    cantidad: 100,
    costo_tela: 8.50,
    costo_estampado: 3.50,
    costo_confeccion: 4.50,
    costo_acabado: 1.50,
    costo_otros: 1.00,
    margen_ganancia: 35,
    costo_unitario: 0,
    costo_total: 0,
    precio_venta_unitario: 0,
    precio_venta_total: 0,
    ganancia_estimada: 0
  };

  // Preview object
  preview = signal({
    costo_unitario: 0,
    costo_total: 0,
    precio_venta_unitario: 0,
    precio_venta_total: 0,
    ganancia_estimada: 0
  });

  // Delete modal state
  showDeleteConfirm = signal(false);
  deletingId = signal<string | null>(null);

  constructor(private cotSvc: CotizacionesService) {}

  ngOnInit() {
    this.loadData();
    this.updateCalculations();
  }

  async loadData() {
    this.loading.set(true);
    try {
      const data = await this.cotSvc.getAll();
      this.cotizaciones.set(data);
    } catch {
      this.error.set('Error al cargar la lista de cotizaciones.');
    } finally {
      this.loading.set(false);
    }
  }

  updateCalculations() {
    const calc = this.cotSvc.calcularCotizacion({
      cantidad: this.form.cantidad,
      costo_tela: this.form.costo_tela,
      costo_estampado: this.form.costo_estampado,
      costo_confeccion: this.form.costo_confeccion,
      costo_acabado: this.form.costo_acabado,
      costo_otros: this.form.costo_otros,
      margen_ganancia: this.form.margen_ganancia
    });

    this.form.costo_unitario = calc.costo_unitario;
    this.form.costo_total = calc.costo_total;
    this.form.precio_venta_unitario = calc.precio_venta_unitario;
    this.form.precio_venta_total = calc.precio_venta_total;
    this.form.ganancia_estimada = calc.ganancia_estimada;

    this.preview.set(calc);
  }

  openNew() {
    this.form = {
      nombre_modelo: '',
      descripcion: '',
      cantidad: 100,
      costo_tela: 8.50,
      costo_estampado: 3.50,
      costo_confeccion: 4.50,
      costo_acabado: 1.50,
      costo_otros: 1.00,
      margen_ganancia: 35,
      costo_unitario: 0,
      costo_total: 0,
      precio_venta_unitario: 0,
      precio_venta_total: 0,
      ganancia_estimada: 0
    };
    this.editingItem.set(null);
    this.updateCalculations();
    this.error.set('');
    this.showModal.set(true);
  }

  openEdit(item: Cotizacion) {
    this.form = { ...item };
    this.editingItem.set(item);
    this.updateCalculations();
    this.error.set('');
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
    this.editingItem.set(null);
  }

  async save() {
    if (!this.form.nombre_modelo.trim()) {
      this.error.set('El nombre del modelo es obligatorio (ej: Polo Oversize).');
      return;
    }

    if (this.form.cantidad <= 0) {
      this.error.set('La cantidad debe ser mayor a 0.');
      return;
    }

    this.updateCalculations();
    this.saving.set(true);
    this.error.set('');
    try {
      const isEditing = !!this.editingItem();
      if (isEditing && this.editingItem()?.id) {
        await this.cotSvc.update(this.editingItem()!.id!, this.form);
        this.showSuccess('Cotización actualizada correctamente');
      } else {
        await this.cotSvc.create(this.form);
        this.showSuccess('Cotización guardada correctamente');
      }
      this.closeModal();
      await this.loadData();
    } catch {
      this.error.set('Error al guardar la cotización.');
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

  async deleteItem() {
    const id = this.deletingId();
    if (!id) return;
    try {
      await this.cotSvc.delete(id);
      this.showSuccess('Cotización eliminada');
      this.cancelDelete();
      await this.loadData();
    } catch {
      this.error.set('Error al eliminar la cotización.');
      this.cancelDelete();
    }
  }

  exportExcel() {
    const headers = ['Modelo', 'Cantidad', 'Costo Tela', 'Costo Estampado', 'Costo Confeccion', 'Costo Acabado', 'Costo Otros', 'Costo Unitario (S/)', 'Costo Total (S/)', 'Precio Venta Unit. (S/)', 'Precio Venta Total (S/)', 'Ganancia (S/)'];
    const rows = this.cotizaciones().map(c => [
      `"${c.nombre_modelo.replace(/"/g, '""')}"`,
      c.cantidad,
      c.costo_tela.toFixed(2),
      c.costo_estampado.toFixed(2),
      c.costo_confeccion.toFixed(2),
      c.costo_acabado.toFixed(2),
      c.costo_otros.toFixed(2),
      c.costo_unitario.toFixed(2),
      c.costo_total.toFixed(2),
      c.precio_venta_unitario.toFixed(2),
      c.precio_venta_total.toFixed(2),
      c.ganancia_estimada.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Cotizaciones_Modelos_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  printPDF() {
    window.print();
  }

  formatCurrency(val: number): string {
    return `S/. ${(val || 0).toFixed(2)}`;
  }

  private showSuccess(msg: string) {
    this.successMsg.set(msg);
    setTimeout(() => this.successMsg.set(''), 4000);
  }
}
