import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.scss'],
})
export class ForgotPassword {
  forgotPasswordForm: FormGroup;
  submitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  hasError(field: string): boolean {
    const control = this.forgotPasswordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      Object.keys(this.forgotPasswordForm.controls).forEach(key => {
        this.forgotPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const email = this.forgotPasswordForm.get('email')?.value;
    
    // Get the current origin (e.g., http://localhost:4200) and construct reset URL
    const clientResetUrl = `${window.location.origin}/reset-password`;

    this.auth.forgotPassword(email, clientResetUrl).subscribe({
      next: (response: any) => {
        this.submitting.set(false);
        this.successMessage.set('Password reset link has been sent to your email address.');
        this.forgotPasswordForm.reset();
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err: any) => {
        this.submitting.set(false);
        
        console.error('=== FORGOT PASSWORD ERROR ===');
        console.error('Full Error Object:', err);
        console.error('Error Status:', err.status);
        console.error('Error Body:', err.error);
        console.error('Error Message:', err.message);
        
        let message = 'Failed to send reset link. Please try again.';
        
        // Handle different error status codes
        if (err.status === 0) {
          message = 'Cannot connect to server. Please check if the backend is running.';
        } else if (err.status === 404) {
          message = 'Forgot password endpoint not found. Please contact support.';
        } else if (err.status === 500) {
          message = 'Server error. The email service may not be configured.';
        } else if (err.error) {
          if (typeof err.error === 'object') {
            message = err.error.message || err.error.Message || err.error.title || message;
          } else if (typeof err.error === 'string') {
            message = err.error;
          }
        }
        
        console.log('Final Error Message:', message);
        this.errorMessage.set(message);
      }
    });
  }
}
