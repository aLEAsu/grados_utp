import { Routes } from '@angular/router';
import { ProcessListComponent } from './process-list/process-list.component';
import { ProcessNewComponent } from './process-new/process-new.component';
import { ProcessDetailComponent } from './process-detail/process-detail.component';

export const PROCESS_ROUTES: Routes = [
  {
    path: '',
    children: [
      {
        path: 'new',
        component: ProcessNewComponent,
        data: { title: 'Nueva Inscripción' }
      },
      {
        path: 'my-process',
        component: ProcessListComponent,
        data: { title: 'Mis Procesos', view: 'my-process' }
      },
      {
        path: 'assigned',
        component: ProcessListComponent,
        data: { title: 'Procesos Asignados', view: 'assigned' }
      },
      {
        path: 'all',
        component: ProcessListComponent,
        data: { title: 'Todos los Procesos', view: 'all' }
      },
      {
        path: ':id',
        component: ProcessDetailComponent,
        data: { title: 'Detalle del Proceso' }
      },
      {
        path: '',
        redirectTo: 'my-process',
        pathMatch: 'full'
      }
    ]
  }
];
