import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RoleDto {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  permissions: number; // bitmask from backend
}

export interface GetRolesResponse {
  success: boolean;
  data?: {
    data: {
      totalItems: number;
      page: number;
      pageSize: number;
      data: any[];
    };
    success: boolean;
    message: string;
  };
}

export interface UpdateRolePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
  permissions?: number[]; // array of enum values
}

@Injectable({ providedIn: 'root' })
export class RoleService {
  private baseUrl = 'https://localhost:7065/api';

  constructor(private http: HttpClient) {}

  getRoles(payload: any): Observable<GetRolesResponse> {
    return this.http.post<GetRolesResponse>(`${this.baseUrl}/Role/get-roles`, payload);
  }

  addRole(role: {
    name: string;
    description: string;
    isActive: boolean;
    permissions: number[];
  }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/Role/add-role`, role);
  }

  updateRole(id: string, body: UpdateRolePayload): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/Role/edit-role/${id}`, body);
  }

  deleteRole(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/Role/delete-role/${id}`);
  }

  getRoleById(id: string): Observable<any> {
    const params = new HttpParams().set('id', id);
    return this.http.get<any>(`${this.baseUrl}/Role/get-role-by-id`, { params });
  }
}
