import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { Auth } from './auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(Auth);
  
  // Get token from localStorage
  const token = localStorage.getItem('accessToken');

  console.log("🔐 AuthInterceptor - Processing request:", req.url);

  // If token exists, clone the request and add Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        console.warn('⛔ 401 Unauthorized detected. Logging out...');
        auth.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
