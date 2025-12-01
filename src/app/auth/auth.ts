import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

interface LoginResponse {
  success: boolean;
  data?: {
    accessToken: string;
    refreshToken: string;
    roles: string;
    fullName: string | null;
    profileImageUrl: string | null;
  };
}

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private apiUrl = "https://localhost:7065/api/Auth/Login";
  private forgotPasswordUrl = "https://localhost:7065/api/Auth/forgot-password";
  private resetPasswordUrl = "https://localhost:7065/api/Auth/reset-password";

  constructor(private http: HttpClient) {}

  login(email: string, password: string): Observable<LoginResponse> {
    const credentials = { email, password };
    return this.http.post<LoginResponse>(this.apiUrl, credentials);
  }

  forgotPassword(email: string, clientResetUrl: string): Observable<any> {
    return this.http.post(this.forgotPasswordUrl, { 
      email, 
      clientResetUrl 
    });
  }

  resetPassword(email: string, token: string, newPassword: string): Observable<any> {
    return this.http.post(this.resetPasswordUrl, { 
      email, 
      token, 
      newPassword,
      confirmPassword: newPassword // Backend might expect this
    });
  }

  // ✔ Correct storeToken with new response structure
  storeToken(data: LoginResponse["data"]): void {
    if (!data) return; // safety check

    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('roles', JSON.stringify(data.roles));
    localStorage.setItem('fullName', data.fullName ?? "");
    localStorage.setItem('profileImageUrl', data.profileImageUrl ?? "");
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
