import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { DocumentVersion, RequirementInstance } from '../models/degree-process.model';

@Injectable({ providedIn: 'root' })
export class DocumentService {
  private readonly apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  uploadDocument(requirementInstanceId: string, file: File, comment?: string): Observable<DocumentVersion> {
    const formData = new FormData();
    formData.append('file', file);
    if (comment) {
      formData.append('comment', comment);
    }

    return this.http.post<DocumentVersion>(
      `${this.apiUrl}/upload/${requirementInstanceId}`,
      formData
    );
  }

  downloadDocument(documentVersionId: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${documentVersionId}/download`, {
      responseType: 'blob'
    });
  }

  getDocumentVersions(requirementInstanceId: string): Observable<DocumentVersion[]> {
    return this.http.get<DocumentVersion[]>(
      `${this.apiUrl}/requirement/${requirementInstanceId}/versions`
    );
  }

  deleteDocumentVersion(documentVersionId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${documentVersionId}`);
  }

  getProcessRequirements(processId: string): Observable<RequirementInstance[]> {
    return this.http.get<RequirementInstance[]>(
      `${this.apiUrl}/process/${processId}/requirements`
    );
  }
}
