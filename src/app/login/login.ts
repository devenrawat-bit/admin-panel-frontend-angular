import { Component, AfterViewInit, signal } from '@angular/core';
import { Auth } from '../auth/auth';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.scss'],
})
export class Login implements AfterViewInit {
  errorMessage = signal("");

  constructor(private auth: Auth, private router: Router) {}

  ngAfterViewInit() {
    // Get form elements
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const emailError = document.getElementById('emailError')!;
    const passwordError = document.getElementById('passwordError')!;
    
    // Project standard email regex
    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]{0,63}@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/;

    let emailTouched = false;

    const validateEmail = () => {
      const email = emailInput.value.trim();
      emailError.textContent = "";
      emailError.classList.remove("visible");

      if (!email) {
        if (emailTouched) {
          emailError.textContent = "Email is required";
          emailError.classList.add("visible");
        }
      } else if (!emailRegex.test(email)) {
        if (emailTouched) {
          emailError.textContent = "Please enter a valid email address";
          emailError.classList.add("visible");
        }
      }
    };

    // Email Listeners
    if (emailInput) {
      emailInput.addEventListener('input', () => {
        if (emailError.classList.contains('visible')) {
           emailTouched = true;
           validateEmail();
        }
      });

      emailInput.addEventListener('blur', () => {
        emailTouched = true;
        validateEmail();
      });
    }

    // Password Listeners
    if (passwordInput) {
      let passwordTouched = false;

      const validatePassword = () => {
        const password = passwordInput.value.trim();
        passwordError.textContent = "";
        passwordError.classList.remove("visible");

        const hasUpperCase = /[A-Z]/.test(password);
        const hasNumber = /[0-9]/.test(password);
        const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

        if (!password) {
          passwordError.textContent = "Password is required";
          passwordError.classList.add("visible");
        } else if (password.length < 8) {
          passwordError.textContent = "Password must be at least 8 characters";
          passwordError.classList.add("visible");
        } else if (!hasUpperCase) {
          passwordError.textContent = "Password must contain at least one uppercase letter";
          passwordError.classList.add("visible");
        } else if (!hasNumber) {
          passwordError.textContent = "Password must contain at least one number";
          passwordError.classList.add("visible");
        } else if (!hasSpecialChar) {
          passwordError.textContent = "Password must contain at least one special character";
          passwordError.classList.add("visible");
        }
      };

      // Real-time validation on input
      passwordInput.addEventListener('input', () => {
        // If error is visible, validate immediately to allow clearing the error
        if (passwordError.classList.contains('visible')) {
          validatePassword();
        } 
        // If they clear the field, show required immediately
        else if (!passwordInput.value.trim()) {
           validatePassword();
        }
      });

      // Validation on blur
      passwordInput.addEventListener('blur', () => {
        passwordTouched = true;
        validatePassword();
      });
    }

    // Add toggle listener after view is initialized
    setTimeout(() => {
      const toggle = document.getElementById('togglePassword');

      if (toggle && passwordInput) {
        toggle.addEventListener('click', () => {
          const isPassword = passwordInput.type === "password";
          passwordInput.type = isPassword ? "text" : "password";
          
          // Toggle SVG icon visibility
          const eyeOpen = toggle.querySelector('.eye-open') as HTMLElement;
          const eyeClosed = toggle.querySelector('.eye-closed') as HTMLElement;
          
          if (eyeOpen && eyeClosed) {
            if (isPassword) {
              eyeOpen.style.display = 'none';
              eyeClosed.style.display = 'block';
            } else {
              eyeOpen.style.display = 'block';
              eyeClosed.style.display = 'none';
            }
          }
        });
      }
    }, 100);
  }

  onSubmit(event: Event) {
    event.preventDefault();

    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    const emailRegex = /^[a-zA-Z0-9][a-zA-Z0-9._%+-]{0,63}@[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,63}$/;

    const emailError = document.getElementById('emailError')!;
    const passwordError = document.getElementById('passwordError')!;

    emailError.textContent = "";
    passwordError.textContent = "";
    emailError.classList.remove("visible");
    passwordError.classList.remove("visible");

    let isValid = true;

    if (!email) {
      emailError.textContent = "Email is required";
      emailError.classList.add("visible");
      isValid = false;
    }
    else if (!emailRegex.test(email)) {
      emailError.textContent = "Please enter a valid email address";
      emailError.classList.add("visible");
      isValid = false;
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!password) {
      passwordError.textContent = "Password is required";
      passwordError.classList.add("visible");
      isValid = false;
    } else if (password.length < 8) {
      passwordError.textContent = "Password must be at least 8 characters";
      passwordError.classList.add("visible");
      isValid = false;
    } else if (!hasUpperCase) {
      passwordError.textContent = "Password must contain at least one uppercase letter";
      passwordError.classList.add("visible");
      isValid = false;
    } else if (!hasNumber) {
      passwordError.textContent = "Password must contain at least one number";
      passwordError.classList.add("visible");
      isValid = false;
    } else if (!hasSpecialChar) {
      passwordError.textContent = "Password must contain at least one special character";
      passwordError.classList.add("visible");
      isValid = false;
    }

    if (!isValid) return;

    this.auth.login(email, password).subscribe({
      next: (response: any) => {
        console.log("=== LOGIN SUCCESS ===");
        
        const tokenData = response.data || response.Data;
        
        if (tokenData) {
          this.auth.storeToken(tokenData);
          this.router.navigate(['/dashboard']);
        } else {
          this.errorMessage.set("Login failed: No token received from server");
          const errorDiv = document.getElementById('loginErrorMessage');
          if (errorDiv) {
            errorDiv.textContent = "Login failed: No token received";
            errorDiv.classList.add('visible');
          }
        }
      },
      error: (err: any) => {
        console.error("=== LOGIN ERROR ===", err);
        
        let message = "Invalid email or password";
        
        if (err.error) {
          if (typeof err.error === 'object') {
            message = err.error.message || err.error.Message || "Invalid email or password";
          } else if (typeof err.error === 'string') {
            message = err.error;
          }
        }
        
        this.errorMessage.set(message);
        
        const errorDiv = document.getElementById('loginErrorMessage');
        if (errorDiv) {
          errorDiv.textContent = message;
          errorDiv.classList.add('visible');
        }
      }
    });
  }
}