import { Injectable } from '@nestjs/common';

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PaginationParams {
  skip: number;
  take: number;
}

@Injectable()
export class PaginationService {
  /**
   * Calculate pagination parameters from page and limit
   * @param page - Page number (1-indexed)
   * @param limit - Items per page
   * @returns Object with skip and take for Prisma queries
   */
  paginate(page: number, limit: number): PaginationParams {
    const pageNumber = Math.max(1, page || 1);
    const limitNumber = Math.max(1, Math.min(limit || 20, 100)); // Max 100 items per page

    const skip = (pageNumber - 1) * limitNumber;
    const take = limitNumber;

    return { skip, take };
  }

  /**
   * Build paginated result with metadata
   * @param data - Array of items
   * @param total - Total count of items
   * @param page - Current page number
   * @param limit - Items per page
   * @returns Paginated result with metadata
   */
  buildPaginatedResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginatedResult<T> {
    const pageNumber = Math.max(1, page || 1);
    const limitNumber = Math.max(1, Math.min(limit || 20, 100));
    const totalPages = Math.ceil(total / limitNumber);

    return {
      data,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages,
      },
    };
  }
}
