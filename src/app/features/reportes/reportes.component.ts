import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RegistrosService } from '../../core/services/registros.service';
import { EmpleadosService } from '../../core/services/empleados.service';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { Empleado, ConfiguracionPrecios, ResumenEmpleado } from '../../core/models/models';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrl: './reportes.component.css'
})
export class ReportesComponent implements OnInit {
  loading = signal(false);
  resumenes = signal<ResumenEmpleado[]>([]);
  config = signal<ConfiguracionPrecios>({ precio_hora_normal: 0, precio_hora_extra: 0, horas_jornada_normal: 8 });
  totalGeneral = signal(0);

  // Periodo seleccionado
  periodoTipo = signal<'semana' | 'mes' | 'personalizado'>('mes');
  fechaInicio = signal('');
  fechaFin = signal('');

  constructor(
    private regSvc: RegistrosService,
    private empSvc: EmpleadosService,
    private cfgSvc: ConfiguracionService
  ) {}

  async ngOnInit() {
    this.config.set(await this.cfgSvc.get());
    this.setPeriodo('mes');
  }

  setPeriodo(tipo: 'semana' | 'mes' | 'personalizado') {
    this.periodoTipo.set(tipo);
    const hoy = new Date();
    if (tipo === 'semana') {
      const lunes = new Date(hoy);
      lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
      this.fechaInicio.set(lunes.toISOString().split('T')[0]);
      this.fechaFin.set(hoy.toISOString().split('T')[0]);
    } else if (tipo === 'mes') {
      const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      this.fechaInicio.set(inicio.toISOString().split('T')[0]);
      this.fechaFin.set(hoy.toISOString().split('T')[0]);
    }
    if (tipo !== 'personalizado') {
      this.generar();
    }
  }

  async generar() {
    if (!this.fechaInicio() || !this.fechaFin()) return;
    this.loading.set(true);
    try {
      const [empleados, registros] = await Promise.all([
        this.empSvc.getAll(),
        this.regSvc.getAll(this.fechaInicio(), this.fechaFin())
      ]);

      const cfg = this.config();
      const map = new Map<string, ResumenEmpleado>();

      empleados.forEach(emp => {
        if (emp.id) {
          map.set(emp.id, {
            empleado: emp,
            total_horas_normales: 0,
            total_horas_extras: 0,
            total_costo: 0,
            dias_trabajados: 0
          });
        }
      });

      registros.forEach(r => {
        if (!r.empleado_id || !map.has(r.empleado_id)) return;
        const res = map.get(r.empleado_id)!;
        res.total_horas_normales += r.horas_normales ?? 0;
        res.total_horas_extras += r.horas_extras ?? 0;

        if (r.costo_total && r.costo_total > 0) {
          res.total_costo += r.costo_total;
        } else {
          const empRol = res.empleado.rol;
          const pNormal = empRol?.precio_hora_normal ?? cfg.precio_hora_normal;
          const pExtra = empRol?.precio_hora_extra ?? cfg.precio_hora_extra;
          res.total_costo += (r.horas_normales ?? 0) * pNormal + (r.horas_extras ?? 0) * pExtra;
        }
        res.dias_trabajados += 1;
      });

      const resultado = Array.from(map.values())
        .filter(r => r.dias_trabajados > 0)
        .sort((a, b) => b.total_costo - a.total_costo);

      // Round values
      resultado.forEach(r => {
        r.total_horas_normales = Math.round(r.total_horas_normales * 100) / 100;
        r.total_horas_extras = Math.round(r.total_horas_extras * 100) / 100;
        r.total_costo = Math.round(r.total_costo * 100) / 100;
      });

      this.resumenes.set(resultado);
      this.totalGeneral.set(Math.round(resultado.reduce((s, r) => s + r.total_costo, 0) * 100) / 100);
    } finally {
      this.loading.set(false);
    }
  }

  exportExcel() {
    const headers = ['Empleado', 'Rol', 'Días Trabajados', 'Horas Normales', 'Horas Extras', 'Total Horas', 'Total a Pagar (S/)'];
    const rows = this.resumenes().map(r => [
      `"${r.empleado.nombre} ${r.empleado.apellido}"`,
      `"${r.empleado.rol?.nombre || 'General'}"`,
      r.dias_trabajados,
      r.total_horas_normales.toFixed(2),
      r.total_horas_extras.toFixed(2),
      (r.total_horas_normales + r.total_horas_extras).toFixed(2),
      r.total_costo.toFixed(2)
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Reporte_Nomina_Pago_${this.fechaInicio()}_al_${this.fechaFin()}.csv`);
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

  initials(e: Empleado): string {
    return `${e.nombre?.[0] ?? ''}${e.apellido?.[0] ?? ''}`.toUpperCase();
  }
}
