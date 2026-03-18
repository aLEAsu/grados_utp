# Documentación de Base de Datos

## Arquitectura y Diseño

La plataforma utiliza **PostgreSQL** como base de datos relacional con **Prisma** como ORM (Object Relational Mapping).

### Diagrama de Entidades

```
Users
├── StudentProfile (1-1)
├── AdvisorProfile (1-1)
├── DegreeProcesses (1-N) [como estudiante]
├── DegreeProcesses (1-N) [como asesor]
├── DocumentVersions (1-N) [quien carga]
├── Approvals (1-N) [quien aprueba]
├── DigitalSignatures (1-N) [quien firma]
├── Observations (1-N) [quien comenta]
├── AuditEvents (1-N)
└── Sessions (1-N)

DegreeModality
├── ModalityRequirements (1-N)
└── DegreeProcesses (1-N)

DocumentType
└── ModalityRequirements (1-N)

DegreeProcess
├── RequirementInstances (1-N)
└── User [student y advisor]

ModalityRequirement
├── RequirementInstances (1-N)
└── DegreeModality, DocumentType (1-1)

RequirementInstance
├── DocumentVersions (1-N)
├── Approvals (1-N)
├── DigitalSignatures (1-N)
└── Observations (1-N)

DocumentVersion
├── Approvals (1-N)
├── DigitalSignatures (1-N)
└── Observations (1-N)
```

## Tablas y Esquema

### 1. Users (Usuarios)

Almacena información de todos los usuarios del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| email | String (UNIQUE) | Email único del usuario |
| passwordHash | String? | Hash bcrypt de contraseña |
| firstName | String | Nombre |
| lastName | String | Apellido |
| phone | String? | Teléfono |
| avatarUrl | String? | URL de foto de perfil |
| role | UserRole (ENUM) | STUDENT, ADVISOR, SECRETARY, ADMIN, SUPERADMIN |
| isActive | Boolean | Si está activo |
| emailVerified | Boolean | Si el email está verificado |
| googleId | String? (UNIQUE) | ID de Google para OAuth |
| institutionalEmail | String? | Email institucional |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### 2. StudentProfile (Perfil de Estudiante)

Información específica de estudiantes.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| userId | UUID (FK, UNIQUE) | Referencia a User |
| studentCode | String (UNIQUE) | Código de estudiante |
| program | String | Programa académico |
| faculty | String | Facultad |
| semester | Int | Semestre actual |
| academicStatus | AcademicStatus (ENUM) | ACTIVE, INACTIVE, GRADUATED, SUSPENDED |
| hasCompletedSubjects | Boolean | Si completó todas las asignaturas |
| externalStudentId | String? | ID en sistema externo |
| lastSyncAt | DateTime? | Última sincronización con sistema externo |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### 3. AdvisorProfile (Perfil de Asesor)

Información específica de asesores.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| userId | UUID (FK, UNIQUE) | Referencia a User |
| department | String | Departamento |
| specialization | String | Especialización |
| maxActiveProcesses | Int (default: 5) | Máximo de procesos activos |
| currentActiveProcesses | Int (default: 0) | Procesos activos actuales |
| isAvailable | Boolean (default: true) | Si está disponible |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

### 4. DegreeModality (Modalidad de Grado)

Define las modalidades de grado disponibles.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| name | String (UNIQUE) | Nombre de modalidad |
| code | DegreeModalityCode (UNIQUE, ENUM) | THESIS, INTERNSHIP, RESEARCH_LINE, DIPLOMA |
| description | String | Descripción |
| isActive | Boolean (default: true) | Si está activa |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Registros predefinidos:**
- THESIS: Tesis
- INTERNSHIP: Pasantías
- RESEARCH_LINE: Líneas de Investigación
- DIPLOMA: Diplomados

### 5. DocumentType (Tipo de Documento)

Define los tipos de documentos que pueden requerirse.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| name | String | Nombre del documento |
| code | String (UNIQUE) | Código único |
| description | String | Descripción |
| acceptedMimeTypes | String[] | MIME types aceptados (ej: "application/pdf") |
| maxFileSizeMb | Int (default: 10) | Tamaño máximo en MB |
| templateUrl | String? | URL de plantilla |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Documentos predefinidos:**
- CARTA_PRESENTACION: Carta de presentación
- ANTEPROYECTO: Anteproyecto
- INFORME_FINAL: Informe final
- CERTIFICADO_NOTAS: Certificado de notas
- PAZ_Y_SALVO: Paz y salvo
- ACTA_SUSTENTACION: Acta de sustentación
- CARTA_ASESOR: Carta del asesor
- CERTIFICADO_PASANTIA: Certificado de pasantía
- ARTICULO_CIENTIFICO: Artículo científico
- CERTIFICADO_DIPLOMADO: Certificado de diplomado

### 6. ModalityRequirement (Requisito de Modalidad)

Mapeo de documentos requeridos por modalidad.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| modalityId | UUID (FK) | Referencia a DegreeModality |
| documentTypeId | UUID (FK) | Referencia a DocumentType |
| isRequired | Boolean (default: true) | Si es obligatorio |
| displayOrder | Int | Orden de visualización |
| instructions | String? | Instrucciones adicionales |
| createdAt | DateTime | Fecha de creación |

**Restricción única:** (modalityId, documentTypeId) - una modalidad no puede tener el mismo documento dos veces.

### 7. DegreeProcess (Proceso de Grado)

Instancia de un proceso de grado para un estudiante.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| studentId | UUID (FK) | Referencia a Student User |
| advisorId | UUID? (FK) | Referencia a Advisor User (opcional) |
| modalityId | UUID (FK) | Referencia a DegreeModality |
| status | ProcessStatus (ENUM) | DRAFT, ACTIVE, IN_REVIEW, APPROVED, COMPLETED, ARCHIVED |
| title | String? | Título del proyecto |
| description | String? | Descripción |
| startedAt | DateTime | Fecha de inicio |
| completedAt | DateTime? | Fecha de completación |
| archivedAt | DateTime? | Fecha de archivado |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Índices:** studentId, advisorId, status

### 8. RequirementInstance (Instancia de Requisito)

Instancia específica de un requisito en un proceso de grado.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| degreeProcessId | UUID (FK) | Referencia a DegreeProcess |
| modalityRequirementId | UUID (FK) | Referencia a ModalityRequirement |
| status | DocumentStatus (ENUM) | POR_CARGAR, PENDIENTE, EN_REVISION, EN_CORRECCION, APROBADO, FINALIZADO |
| createdAt | DateTime | Fecha de creación |
| updatedAt | DateTime | Última actualización |

**Restricción única:** (degreeProcessId, modalityRequirementId) - un proceso no puede tener el mismo requisito dos veces.

### 9. DocumentVersion (Versión de Documento)

Versiones de un documento específico.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| requirementInstanceId | UUID (FK) | Referencia a RequirementInstance |
| versionNumber | Int | Número de versión |
| fileName | String | Nombre del archivo guardado |
| originalFileName | String | Nombre original del archivo |
| mimeType | String | MIME type |
| fileSizeByte | Int | Tamaño en bytes |
| storagePath | String | Ruta de almacenamiento |
| hashSha256 | String | Hash SHA-256 para integridad |
| uploadedById | UUID (FK) | Referencia a User quien cargó |
| uploadedAt | DateTime | Fecha de carga |
| comment | String? | Comentario del cargante |

**Índices:** requirementInstanceId

### 10. Approval (Aprobación)

Registra aprobaciones de documentos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| requirementInstanceId | UUID (FK) | Referencia a RequirementInstance |
| documentVersionId | UUID (FK) | Referencia a DocumentVersion |
| approverUserId | UUID (FK) | Referencia a User aprobador |
| type | ApprovalType (ENUM) | ACADEMIC, ADMINISTRATIVE |
| decision | ApprovalDecision (ENUM) | APPROVED, REJECTED, REVISION_REQUESTED |
| observations | String? | Observaciones del aprobador |
| approvedAt | DateTime | Fecha de aprobación |

### 11. DigitalSignature (Firma Digital)

Registra firmas digitales aplicadas a documentos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| requirementInstanceId | UUID (FK) | Referencia a RequirementInstance |
| documentVersionId | UUID (FK) | Referencia a DocumentVersion |
| signedById | UUID (FK) | Referencia a User firmante |
| signatureHash | String | Hash de la firma |
| certificateSerial | String? | Número de serie del certificado |
| signedDocumentPath | String? | Ruta del documento firmado |
| timestamp | DateTime | Timestamp de la firma |
| metadata | Json? | Metadatos adicionales |

### 12. Observation (Observación)

Comentarios y observaciones sobre documentos.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| requirementInstanceId | UUID (FK) | Referencia a RequirementInstance |
| documentVersionId | UUID? (FK) | Referencia a DocumentVersion específica (opcional) |
| authorId | UUID (FK) | Referencia a User autor |
| content | String | Contenido de la observación |
| isResolved | Boolean (default: false) | Si ha sido resuelta |
| resolvedAt | DateTime? | Fecha de resolución |
| createdAt | DateTime | Fecha de creación |

### 13. Notification (Notificación)

Notificaciones del sistema para usuarios.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| userId | UUID (FK) | Referencia a User |
| type | NotificationType (ENUM) | DOCUMENT_UPLOADED, REVIEW_REQUESTED, APPROVAL_GRANTED, REVISION_REQUIRED, PROCESS_COMPLETED, SIGNATURE_APPLIED, GENERAL |
| title | String | Título de la notificación |
| message | String | Mensaje |
| isRead | Boolean (default: false) | Si ha sido leída |
| readAt | DateTime? | Fecha de lectura |
| metadata | Json? | Datos adicionales (ej: IDs de entidades) |
| createdAt | DateTime | Fecha de creación |

**Índices:** (userId, isRead)

### 14. AuditEvent (Evento de Auditoría)

Registro de todas las acciones importantes del sistema.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| userId | UUID? (FK) | Referencia a User (puede ser nulo para acciones del sistema) |
| userRole | String? | Rol del usuario en el momento de la acción |
| action | String | Tipo de acción (CREATE, UPDATE, DELETE, etc) |
| entity | String | Tipo de entidad afectada |
| entityId | String | ID de la entidad |
| previousValue | Json? | Valor anterior (para updates) |
| newValue | Json? | Nuevo valor (para updates) |
| ipAddress | String? | IP del cliente |
| userAgent | String? | User agent del navegador |
| timestamp | DateTime (default: now()) | Fecha y hora |

**Índices:** (entity, entityId), userId, timestamp

### 15. Session (Sesión de Usuario)

Gestión de sesiones y tokens.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | UUID (PK) | Identificador único |
| userId | UUID (FK) | Referencia a User |
| token | String (UNIQUE) | JWT token |
| refreshToken | String? (UNIQUE) | Refresh token |
| expiresAt | DateTime | Fecha de expiración |
| ipAddress | String? | IP del cliente |
| userAgent | String? | User agent |
| isActive | Boolean (default: true) | Si está activa |
| createdAt | DateTime | Fecha de creación |

## Enums

### UserRole
```
STUDENT - Estudiante
ADVISOR - Asesor/Docente
SECRETARY - Personal de secretaría
ADMIN - Administrador
SUPERADMIN - Super administrador
```

### AcademicStatus
```
ACTIVE - Activo
INACTIVE - Inactivo
GRADUATED - Graduado
SUSPENDED - Suspendido
```

### DegreeModalityCode
```
THESIS - Tesis
INTERNSHIP - Pasantías
RESEARCH_LINE - Líneas de Investigación
DIPLOMA - Diplomados
```

### ProcessStatus
```
DRAFT - Borrador
ACTIVE - Activo
IN_REVIEW - En revisión
APPROVED - Aprobado
COMPLETED - Completado
ARCHIVED - Archivado
```

### DocumentStatus
```
POR_CARGAR - Por cargar
PENDIENTE - Pendiente
EN_REVISION - En revisión
EN_CORRECCION - En corrección
APROBADO - Aprobado
FINALIZADO - Finalizado
```

### ApprovalType
```
ACADEMIC - Aprobación académica
ADMINISTRATIVE - Aprobación administrativa
```

### ApprovalDecision
```
APPROVED - Aprobado
REJECTED - Rechazado
REVISION_REQUESTED - Se solicita revisión
```

### NotificationType
```
DOCUMENT_UPLOADED - Documento cargado
REVIEW_REQUESTED - Solicitud de revisión
APPROVAL_GRANTED - Aprobación otorgada
REVISION_REQUIRED - Se requiere revisión
PROCESS_COMPLETED - Proceso completado
SIGNATURE_APPLIED - Firma aplicada
GENERAL - Notificación general
```

## Constraints y Restricciones

### Claves Primarias
- Todas las tablas usan UUID como PK (salvo `Seed`)

### Claves Foráneas
- CASCADE: Eliminación en cascada para dependencias fuertes
- RESTRICT: Prevenir eliminación si hay dependencias (procesos activos)
- SET NULL: Permitir nulidad (ej: advisor en proceso)

### Restricciones Únicas
- `User.email`: Email único globalmente
- `User.googleId`: Google ID único
- `StudentProfile.userId`: Un perfil por estudiante
- `StudentProfile.studentCode`: Código de estudiante único
- `AdvisorProfile.userId`: Un perfil por asesor
- `DegreeModality.code`: Código de modalidad único
- `DocumentType.code`: Código de documento único
- `ModalityRequirement`: Una combinación (modalidad, documento) única
- `RequirementInstance`: Una combinación (proceso, requisito) única

### Índices Principales
```sql
-- Usuario y búsquedas
users(email)
users(institutional_email)
student_profiles(student_code)

-- Procesos
degree_processes(student_id)
degree_processes(advisor_id)
degree_processes(status)

-- Documentos y estados
requirement_instances(degree_process_id)
requirement_instances(status)
document_versions(requirement_instance_id)

-- Notificaciones y auditoría
notifications(user_id, is_read)
audit_events(entity, entity_id)
audit_events(user_id)
audit_events(timestamp)
```

## Migraciones

Las migraciones se gestionan con Prisma:

```bash
# Crear nueva migración
npm run prisma:migrate:dev -- --name nombre_migracion

# Aplicar migraciones pendientes
npm run prisma:migrate:deploy

# Ver historial
ls prisma/migrations/
```

## Seeds y Datos Iniciales

El archivo `prisma/seed.ts` carga:

1. **4 Modalidades de Grado**
2. **10 Tipos de Documentos**
3. **Requisitos por Modalidad** (mapeos)
4. **Usuarios de Prueba**
   - SUPERADMIN: admin@itp.edu.co
   - SECRETARY: secretaria@itp.edu.co

Ejecutar:
```bash
npm run prisma:seed
```

## Optimización y Performance

### Queries Frecuentes

```typescript
// Obtener proceso de grado con todas sus dependencias
await prisma.degreeProcess.findUnique({
  where: { id },
  include: {
    student: true,
    advisor: true,
    modality: {
      include: {
        modalityRequirements: {
          include: { documentType: true }
        }
      }
    },
    requirementInstances: {
      include: {
        documentVersions: true,
        approvals: true,
        observations: true
      }
    }
  }
});

// Obtener notificaciones no leídas de usuario
await prisma.notification.findMany({
  where: {
    userId,
    isRead: false
  },
  orderBy: { createdAt: 'desc' },
  take: 20
});

// Auditoria de cambios en proceso
await prisma.auditEvent.findMany({
  where: {
    entity: 'DegreeProcess',
    entityId: processId
  },
  orderBy: { timestamp: 'desc' }
});
```

### Paginación

```typescript
await prisma.degreeProcess.findMany({
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { createdAt: 'desc' }
});
```

## Backup y Recuperación

### Backup de PostgreSQL

```bash
# Crear backup
docker-compose exec postgres pg_dump -U itp_admin plataforma_grados > backup.sql

# Restaurar backup
docker-compose exec -T postgres psql -U itp_admin plataforma_grados < backup.sql
```

## Referencias

- Prisma Documentation: https://www.prisma.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs
- Database Design: https://www.ibm.com/cloud/learn/database-design

---

**Última actualización**: Marzo 2026
