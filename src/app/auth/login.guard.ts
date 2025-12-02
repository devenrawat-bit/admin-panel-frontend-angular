import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './auth';

/**
 * Login Guard - Prevents logged-in users from accessing login page
 * If user is already logged in, redirect to dashboard
 */
export const loginGuard = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  // If user is already logged in, redirect to dashboard
  if (auth.isLoggedIn()) {
    console.log('User is already logged in, redirecting to dashboard');
    router.navigate(['/dashboard']);
    return false;
  }

  // If not logged in, allow access to login page
  return true;
};
