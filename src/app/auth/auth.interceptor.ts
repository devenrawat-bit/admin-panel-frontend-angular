import { Injectable } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Get token from localStorage
  const token = localStorage.getItem('accessToken');

  console.log("🔐 AuthInterceptor - Processing request:", req.url);
  console.log("🔐 Token found:", token ? "✅ Yes" : "❌ No");

  // If token exists, clone the request and add Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("🔐 Token attached to request:", token.substring(0, 20) + "...");
  }

  return next(req);
};
