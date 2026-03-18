export enum NotificationType {
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  DOCUMENT_APPROVED = 'DOCUMENT_APPROVED',
  DOCUMENT_REJECTED = 'DOCUMENT_REJECTED',
  PROCESS_STATUS_CHANGED = 'PROCESS_STATUS_CHANGED',
  REVIEW_REQUESTED = 'REVIEW_REQUESTED',
  OBSERVATION_ADDED = 'OBSERVATION_ADDED',
  ADVISOR_ASSIGNED = 'ADVISOR_ASSIGNED',
  SIGNATURE_REQUESTED = 'SIGNATURE_REQUESTED',
  GENERAL = 'GENERAL'
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  userId?: string;
  action: string;
  entity: string;
  entityId: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: import('./user.model').User;
}
