// src/app/cms/cms.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface CmsDto {
  id: number;
  key: string;
  title: string;
  metaKeyword: string;
  content: string;
  isActive: boolean;
}

export interface CmsListResponse {
  success: boolean;
  data: {
    data: CmsDto[];
    totalItems: number;
    page: number;
    pageSize: number;
  };
}

@Injectable({ providedIn: 'root' })
export class CmsService {
  private baseUrl = 'https://localhost:7065/api';

  constructor(private http: HttpClient) {}

  // list (server-side pagination)
  getCmsList(payload: {
    page: number;
    pageSize: number;
    search?: string;
    sortColumn?: string;
    sortDirection?: string;
    filters?: Record<string, string>;
  }): Observable<CmsListResponse> {
    return this.http.post<CmsListResponse>(`${this.baseUrl}/Cms/get-cms`, payload);
  }

  // GET /api/Cms/get-cms-by-id?id=5
  getCmsById(id: number): Observable<{ success: boolean; data: CmsDto }> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<{ success: boolean; data: CmsDto }>(
      `${this.baseUrl}/Cms/get-cms-by-id`,
      { params }
    );
  }

  // POST /api/Cms/add-cms
  addCms(body: {
    key: string;
    title: string;
    metaKeyword: string;
    isActive: boolean;
    content: string;
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Cms/add-cms`, body);
  }

  // PUT /api/Cms/update-cms/{id}
  updateCms(
    id: number,
    body: {
      key: string;
      title: string;
      metaKeyword: string;
      isActive: boolean;
      content: string;
    }
  ): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Cms/update-cms/${id}`, body);
  }

  // DELETE /api/Cms/delete-cms/{id}
  deleteCms(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/Cms/delete-cms/${id}`);
  }
}
