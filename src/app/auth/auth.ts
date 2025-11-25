import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  roles: string;
  fullName: string | null;
  profileImageUrl: string | null;
}

@Injectable({
  providedIn: 'root', //this makes sure the service is available application-wide
})
export class Auth {
  private apiUrl="https://localhost:7065/api/Auth/Login";
  constructor(private http: HttpClient) {}
  login(email: string, password: string): Observable<LoginResponse> {
    const credentials = { email, password };
    return this.http.post<LoginResponse>(this.apiUrl,credentials);
  }
  //now storing token in local storage
  storeToken(tokens: LoginResponse): void {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('roles', JSON.stringify(tokens.roles));
  localStorage.setItem('fullName', tokens.fullName ?? "");
  localStorage.setItem('profileImageUrl', tokens.profileImageUrl ?? "");
}

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }
  
  logout() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('roles');
  localStorage.removeItem('fullName');
  localStorage.removeItem('profileImageUrl');
}
  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
