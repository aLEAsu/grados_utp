export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  details?: Record<string, any>;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
  };
}

export interface DashboardStats {
  totalProcesses: number;
  activeProcesses: number;
  pendingReviews: number;
  completedProcesses: number;
  totalStudents: number;
  totalAdvisors: number;
  processesByModality: { modality: string; count: number }[];
  processesByStatus: { status: string; count: number }[];
  recentActivity: { action: string; date: string; user: string }[];
}
