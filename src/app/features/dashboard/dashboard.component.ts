import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { EmpleadosService } from '../../core/services/empleados.service';
import { RegistrosService } from '../../core/services/registros.service';
import { ConfiguracionService } from '../../core/services/configuracion.service';
import { RegistroHoras } from '../../core/models/models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  stats = signal({ empleados: 0, registrosHoy: 0, horasHoy: 0, costoHoy: 0 });
  registrosRecientes = signal<RegistroHoras[]>([]);
  loading = signal(true);
  hoy = new Date().toISOString().split('T')[0];

  constructor(
    private empSvc: EmpleadosService,
    private regSvc: RegistrosService,
    private cfgSvc: ConfiguracionService
  ) {}

  async ngOnInit() {
    try {
      const [empleados, registros, config] = await Promise.all([
        this.empSvc.getActivos(),
        this.regSvc.getAll(this.hoy, this.hoy),
        this.cfgSvc.get()
      ]);

      const horasHoy = registros.reduce((sum, r) => sum + (r.horas_normales || 0) + (r.horas_extras || 0), 0);
      const costoHoy = registros.reduce((sum, r) => {
        if (r.costo_total && r.costo_total > 0) return sum + r.costo_total;
        const pNormal = r.empleado?.rol?.precio_hora_normal ?? config.precio_hora_normal;
        const pExtra = r.empleado?.rol?.precio_hora_extra ?? config.precio_hora_extra;
        const normal = (r.horas_normales || 0) * pNormal;
        const extra = (r.horas_extras || 0) * pExtra;
        return sum + normal + extra;
      }, 0);

      this.stats.set({
        empleados: empleados.length,
        registrosHoy: registros.length,
        horasHoy: Math.round(horasHoy * 10) / 10,
        costoHoy: Math.round(costoHoy * 100) / 100
      });

      // Last 5 records
      const all = await this.regSvc.getAll();
      this.registrosRecientes.set(all.slice(0, 5));
    } finally {
      this.loading.set(false);
    }
  }

  formatHora(time: string | null): string {
    if (!time) return '--:--';
    return time.substring(0, 5);
  }

  formatCurrency(val: number): string {
    return `S/. ${(val || 0).toFixed(2)}`;
  }
}
