import { Component, signal, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.scss'],
})
export class ResetPassword {
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;
  @ViewChild('confirmPasswordInput') confirmPasswordInput!: ElementRef<HTMLInputElement>;

  resetPasswordForm: FormGroup;
  submitting = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  showPassword = signal(false);
  showConfirmPassword = signal(false);
  
  private token: string = '';
  private email: string = '';

  constructor(
    private fb: FormBuilder,
    private auth: Auth,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.resetPasswordForm = this.fb.group({
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Get token and email from query params
    this.route.queryParams.subscribe(params => {
      this.token = params['token'] || '';
      this.email = params['email'] || '';
      
      if (!this.token || !this.email) {
        this.errorMessage.set('Invalid or missing reset token. Please request a new password reset link.');
      }
    });
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  hasError(field: string): boolean {
    const control = this.resetPasswordForm.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword.set(!this.showPassword());
      if (this.passwordInput) {
        this.passwordInput.nativeElement.type = this.showPassword() ? 'text' : 'password';
      }
    } else {
      this.showConfirmPassword.set(!this.showConfirmPassword());
      if (this.confirmPasswordInput) {
        this.confirmPasswordInput.nativeElement.type = this.showConfirmPassword() ? 'text' : 'password';
      }
    }
  }

  hasUpperCase(): boolean {
    const password = this.resetPasswordForm.get('password')?.value || '';
    return /[A-Z]/.test(password);
  }

  hasLowerCase(): boolean {
    const password = this.resetPasswordForm.get('password')?.value || '';
    return /[a-z]/.test(password);
  }

  hasNumber(): boolean {
    const password = this.resetPasswordForm.get('password')?.value || '';
    return /\d/.test(password);
  }

  hasSpecialChar(): boolean {
    const password = this.resetPasswordForm.get('password')?.value || '';
    return /[@$!%*?&]/.test(password);
  }

  hasMinLength(): boolean {
    const password = this.resetPasswordForm.get('password')?.value || '';
    return password.length >= 8;
  }

  onSubmit() {
    if (this.resetPasswordForm.invalid) {
      Object.keys(this.resetPasswordForm.controls).forEach(key => {
        this.resetPasswordForm.get(key)?.markAsTouched();
      });
      return;
    }

    if (!this.token || !this.email) {
      this.errorMessage.set('Invalid reset token. Please request a new password reset link.');
      return;
    }

    this.submitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const password = this.resetPasswordForm.get('password')?.value;

    this.auth.resetPassword(this.email, this.token, password).subscribe({
      next: (response: any) => {
        this.submitting.set(false);
        this.successMessage.set('Password reset successful! Redirecting to login...');
        this.resetPasswordForm.reset();
        
        // Redirect to login after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err: any) => {
        this.submitting.set(false);
        
        let message = 'Failed to reset password. Please try again or request a new reset link.';
        
        if (err.error) {
          if (typeof err.error === 'object') {
            message = err.error.message || err.error.Message || message;
          } else if (typeof err.error === 'string') {
            message = err.error;
          }
        }
        
        this.errorMessage.set(message);
      }
    });
  }
}
