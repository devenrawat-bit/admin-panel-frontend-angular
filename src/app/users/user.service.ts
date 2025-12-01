import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class UserService {

  private baseUrl = 'https://localhost:7065/api';  // ✔ correct variable

  constructor(private http: HttpClient) { }

  // ----- USERS -----

  getUsers(payload: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/User/get-users`, payload);
  }

  getUserById(id: string): Observable<any> {
    const body = {
      page: 1,
      pageSize: 1,
      search: "",
      sortColumn: "",
      sortDirection: "",
      filters: { id }
    };

    return this.http.post<any>(`${this.baseUrl}/User/get-users`, body);
  }

  createUser(fd: FormData): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/User/create`, fd);
  }

  updateUser(id: string, fd: FormData): Observable<any> {
    // Add ID to FormData since backend expects it in the body, not URL
    fd.append('Id', id);
    return this.http.put<any>(`${this.baseUrl}/User/edit-user`, fd);
  }

  deleteUser(id: string): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}/User/delete-user/${id}`);
  }

  // dropdown APIs
  getRoles() {
    const payload = {
      page: 1,
      pageSize: 100, // Get all roles
      search: "",
      sortColumn: "name",
      sortDirection: "asc",
      filters: {}
    };
    return this.http.post<any>(`${this.baseUrl}/Role/get-roles`, payload);
  }

  getCountries() {
    return this.http.get<any>(`${this.baseUrl}/User/countries`);
  }

  getStates(countryId: number) {
    return this.http.get<any>(`${this.baseUrl}/User/state/${countryId}`);
  }

  getCities(stateId: number) {
    return this.http.get<any>(`${this.baseUrl}/User/city/${stateId}`);
  }
}
