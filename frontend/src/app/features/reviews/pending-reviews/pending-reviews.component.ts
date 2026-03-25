import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApprovalDecision } from '../../../core/models/degree-process.model';
import { ReviewService } from '../../../core/services/review.service';
import { DocumentService } from '../../../core/services/document.service';

@Component({
  selector: 'app-pending-reviews',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './pending-reviews.component.html',
  styleUrl: './pending-reviews.component.css'
})
export class PendingReviewsComponent implements OnInit {
  reviews = signal<any[]>([]);
  loading = signal(true);
  error = signal('');
  searchTerm = '';
  processingId: string | null = null;
  observationTexts: Record<string, string> = {};
  validationErrors: Record<string, string> = {};
  expandedId: string | null = null;

  constructor(
    private reviewService: ReviewService,
    private documentService: DocumentService
  ) {}

  ngOnInit(): void {
    this.loadReviews();
  }

  loadReviews(): void {
    this.loading.set(true);
    this.error.set('');

    this.reviewService.getPendingAcademicReviews().subscribe({
      next: (data) => {
        this.reviews.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando revisiones:', err);
        this.error.set('Error al cargar las revisiones pendientes.');
        this.loading.set(false);
      }
    });
  }

  get filteredReviews(): any[] {
    if (!this.searchTerm) return this.reviews();
    const term = this.searchTerm.toLowerCase();
    return this.reviews().filter((r: any) =>
      (r.title || '').toLowerCase().includes(term) ||
      (r.studentName || '').toLowerCase().includes(term) ||
      (r.documentName || '').toLowerCase().includes(term)
    );
  }

  toggleExpand(id: string): void {
    this.expandedId = this.expandedId === id ? null : id;
  }

  downloadDocument(documentVersionId: string, fileName: string): void {
    this.documentService.downloadDocument(documentVersionId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'documento';
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error descargando:', err)
    });
  }

  approve(item: any): void {
    if (this.processingId) return;
    const reqId = item.requirementInstanceId || item.id;
    this.processingId = reqId;

    this.reviewService.createAcademicApproval(reqId, {
      decision: ApprovalDecision.APPROVED,
      observations: this.observationTexts[item.id] || undefined
    }).subscribe({
      next: () => {
        this.processingId = null;
        this.loadReviews();
      },
      error: (err) => {
        console.error('Error al aprobar:', err);
        this.processingId = null;
      }
    });
  }

  requestCorrection(item: any): void {
    if (this.processingId) return;
    const comment = this.observationTexts[item.id];
    if (!comment?.trim()) {
      this.validationErrors[item.id] = 'Debes agregar una observación antes de solicitar corrección.';
      return;
    }
    this.validationErrors[item.id] = '';
    const reqId = item.requirementInstanceId || item.id;
    this.processingId = reqId;

    this.reviewService.createAcademicApproval(reqId, {
      decision: ApprovalDecision.REVISION_REQUESTED,
      observations: comment
    }).subscribe({
      next: () => {
        this.processingId = null;
        this.observationTexts[item.id] = '';
        this.loadReviews();
      },
      error: (err) => {
        console.error('Error al solicitar corrección:', err);
        this.processingId = null;
      }
    });
  }

  reject(item: any): void {
    if (this.processingId) return;
    const comment = this.observationTexts[item.id];
    if (!comment?.trim()) {
      this.validationErrors[item.id] = 'Debes agregar una observación para rechazar el documento.';
      return;
    }
    this.validationErrors[item.id] = '';
    const reqId = item.requirementInstanceId || item.id;
    this.processingId = reqId;

    this.reviewService.createAcademicApproval(reqId, {
      decision: ApprovalDecision.REJECTED,
      observations: comment
    }).subscribe({
      next: () => {
        this.processingId = null;
        this.observationTexts[item.id] = '';
        this.loadReviews();
      },
      error: (err) => {
        console.error('Error al rechazar:', err);
        this.processingId = null;
      }
    });
  }

  addObservation(item: any): void {
    const text = this.observationTexts[item.id];
    const reqId = item.requirementInstanceId || item.id;
    if (!text?.trim()) return;

    this.reviewService.addObservation(reqId, {
      content: text,
      documentVersionId: item.documentVersionId
    }).subscribe({
      next: () => {
        this.observationTexts[item.id] = '';
      },
      error: (err) => console.error('Error al agregar observación:', err)
    });
  }
}
