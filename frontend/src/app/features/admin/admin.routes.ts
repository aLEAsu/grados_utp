import { Routes } from '@angular/router';
import { UserManagementComponent } from './user-management/user-management.component';
import { ModalityManagementComponent } from './modality-management/modality-management.component';
import { AuditLogComponent } from './audit-log/audit-log.component';

export const adminRoutes: Routes = [
  {
    path: 'users',
    component: UserManagementComponent,
    data: { title: 'Gestión de Usuarios' }
  },
  {
    path: 'modalities',
    component: ModalityManagementComponent,
    data: { title: 'Gestión de Modalidades' }
  },
  {
    path: 'audit',
    component: AuditLogComponent,
    data: { title: 'Log de Auditoría' }
  },
  {
    path: '',
    redirectTo: 'users',
    pathMatch: 'full'
  }
];
