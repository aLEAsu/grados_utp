import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditEvent } from '../../../core/models/notification.model';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-log.component.html',
  styleUrl: './audit-log.component.css'
})
export class AuditLogComponent implements OnInit {
  events = signal<AuditEvent[]>([]);
  loading = signal(true);
  error = signal('');
  filterUser = '';
  filterAction = 'all';
  filterStartDate = '';
  filterEndDate = '';

  actions = ['all', 'CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'LOGIN', 'LOGOUT', 'UPLOAD', 'DOWNLOAD'];

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  loadEvents(): void {
    this.loading.set(true);
    this.error.set('');

    const params: any = { page: 1, limit: 100 };
    if (this.filterAction !== 'all') params.action = this.filterAction;

    this.adminService.getAuditEvents(params).subscribe({
      next: (response: any) => {
        const events = Array.isArray(response) ? response : (response.data || []);
        this.events.set(events);
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error cargando auditoría:', err);
        this.error.set('Error al cargar el log de auditoría.');
        this.loading.set(false);
      }
    });
  }

  get filteredEvents(): AuditEvent[] {
    return this.events().filter(event => {
      const matchesUser = !this.filterUser ||
        (event.user?.firstName || '').toLowerCase().includes(this.filterUser.toLowerCase());
      const matchesAction = this.filterAction === 'all' || event.action === this.filterAction;

      let matchesDate = true;
      if (this.filterStartDate) {
        matchesDate = new Date(event.createdAt) >= new Date(this.filterStartDate);
      }
      if (this.filterEndDate && matchesDate) {
        const end = new Date(this.filterEndDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = new Date(event.createdAt) <= end;
      }
      return matchesUser && matchesAction && matchesDate;
    });
  }

  getActionIcon(action: string): string {
    const icons: Record<string, string> = {
      CREATE: 'pi pi-plus-circle',
      UPDATE: 'pi pi-pencil',
      DELETE: 'pi pi-trash',
      APPROVE: 'pi pi-check-circle',
      REJECT: 'pi pi-times-circle',
      LOGIN: 'pi pi-sign-in',
      LOGOUT: 'pi pi-sign-out',
      UPLOAD: 'pi pi-upload',
      DOWNLOAD: 'pi pi-download',
    };
    return icons[action] || 'pi pi-info-circle';
  }

  getActionClass(action: string): string {
    const classes: Record<string, string> = {
      CREATE: 'action-create',
      UPDATE: 'action-update',
      DELETE: 'action-delete',
      APPROVE: 'action-approve',
      REJECT: 'action-reject',
      LOGIN: 'action-login',
      LOGOUT: 'action-logout',
      UPLOAD: 'action-upload',
      DOWNLOAD: 'action-download',
    };
    return classes[action] || 'action-default';
  }

  clearFilters(): void {
    this.filterUser = '';
    this.filterAction = 'all';
    this.filterStartDate = '';
    this.filterEndDate = '';
  }

  exportCSV(): void {
    const headers = ['Fecha', 'Usuario', 'Acción', 'Entidad', 'ID Entidad', 'IP'];
    const rows = this.filteredEvents.map(e => [
      new Date(e.createdAt).toLocaleString('es-CO'),
      e.user?.firstName || e.userId || 'Sistema',
      e.action,
      e.entity,
      e.entityId,
      e.ipAddress || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }
}
