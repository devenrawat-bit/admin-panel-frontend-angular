import { Component, AfterViewInit, signal } from '@angular/core';
import { Auth } from '../auth/auth';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
// import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
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
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    // Add input restriction for email field
    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        // Only allow letters, numbers, dots, underscores, hyphens, and @
        target.value = target.value.replace(/[^a-zA-Z0-9._@-]/g, '');
      });

      // Validate email on blur (clicking outside)
      emailInput.addEventListener('blur', () => {
        const email = emailInput.value.trim();
        
        emailError.textContent = "";
        emailError.classList.remove("visible");

        if (!email) {
          emailError.textContent = "Email is required";
          emailError.classList.add("visible");
        } else if (!emailRegex.test(email)) {
          emailError.textContent = "Please enter a valid email address";
          emailError.classList.add("visible");
        }
      });

      // Clear error on focus
      emailInput.addEventListener('focus', () => {
        emailError.textContent = "";
        emailError.classList.remove("visible");
      });
    }

    // Validate password on blur (clicking outside)
    if (passwordInput) {
      passwordInput.addEventListener('blur', () => {
        const password = passwordInput.value.trim();
        
        passwordError.textContent = "";
        passwordError.classList.remove("visible");

        if (!password) {
          passwordError.textContent = "Password is required";
          passwordError.classList.add("visible");
        } else if (password.length < 8 || password.length > 50) {
          passwordError.textContent = "Password must be 8–50 characters";
          passwordError.classList.add("visible");
        } else if (!/[A-Z]/.test(password)) {
          passwordError.textContent = "Must contain at least 1 uppercase letter";
          passwordError.classList.add("visible");
        } else if (!/[a-z]/.test(password)) {
          passwordError.textContent = "Must contain at least 1 lowercase letter";
          passwordError.classList.add("visible");
        } else if (!/[0-9]/.test(password)) {
          passwordError.textContent = "Must contain at least 1 number";
          passwordError.classList.add("visible");
        } else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
          passwordError.textContent = "Must contain at least 1 special character";
          passwordError.classList.add("visible");
        }
      });

      // Clear error on focus
      passwordInput.addEventListener('focus', () => {
        passwordError.textContent = "";
        passwordError.classList.remove("visible");
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

    const email = (document.getElementById('email') as HTMLInputElement).value.trim();
    const password = (document.getElementById('password') as HTMLInputElement).value.trim();

    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

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
      // emailError.style.display = "block";

      isValid = false;
    }
    else if (!emailRegex.test(email)) {
      emailError.textContent = "Please enter a valid email address";
      emailError.classList.add("visible");
      isValid = false;
    }

    if (!password) {
      passwordError.textContent = "Password is required";
      passwordError.classList.add("visible");
      // passwordError.style.display = "block";
      isValid = false;
    }
    else if (password.length < 8 || password.length > 50) {
      passwordError.textContent = "Password must be 8–50 characters";
      passwordError.classList.add("visible");
      isValid = false;
    }
    else if (!/[A-Z]/.test(password)) {
      passwordError.textContent = "Must contain at least 1 uppercase letter";
      passwordError.classList.add("visible");
      isValid = false;
    }
    
    else if (!/[a-z]/.test(password)) {
      passwordError.textContent = "Must contain at least 1 lowercase letter";
      passwordError.classList.add("visible");
      isValid = false;
    }
    else if (!/[0-9]/.test(password)) {
      passwordError.textContent = "Must contain at least 1 number";
      passwordError.classList.add("visible");
      isValid = false;
    }
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      passwordError.textContent = "Must contain at least 1 special character";
      passwordError.classList.add("visible");
      isValid = false;
    }

    if (!isValid) return;

 this.auth.login(email, password).subscribe({
  next: (response: any) => {
    console.log("=== LOGIN SUCCESS ===");
    console.log("Full Response:", response);
    console.log("Response keys:", Object.keys(response));
    console.log("Response.data:", response.data);
    console.log("Response.Data:", response.Data);
    
    // Check if data exists in response
    const tokenData = response.data || response.Data;
    
    if (tokenData) {
      console.log("Token data found:", tokenData);
      this.auth.storeToken(tokenData);
      console.log("Token stored successfully, navigating to dashboard");
      this.router.navigate(['/dashboard']);
    } else {
      console.error("No token data found in response");
      this.errorMessage.set("Login failed: No token received from server");
      const errorDiv = document.getElementById('loginErrorMessage');
      if (errorDiv) {
        errorDiv.textContent = "Login failed: No token received";
        errorDiv.classList.add('visible');
      }
    }
  },

  error: (err: any) => {
    console.error("=== LOGIN ERROR ===");
    console.error("Full Error Object:", err);
    console.error("Error Body:", err.error);
    console.error("Error Status:", err.status);
    console.error("Error Message:", err.message);
    
    // Handle different error response formats
    let message = "Invalid email or password";
    
    if (err.error) {
      // If error is an object with message property
      if (typeof err.error === 'object') {
        message = err.error.message || err.error.Message || "Invalid email or password";
      }
      // If error is a string
      else if (typeof err.error === 'string') {
        message = err.error;
      }
    }
    
    console.log("Final Error Message:", message);
    this.errorMessage.set(message);
    
    // Also display error in DOM directly
    const errorDiv = document.getElementById('loginErrorMessage');
    if (errorDiv) {
      errorDiv.textContent = message;
      errorDiv.classList.add('visible');
      console.log("Error div updated in DOM");
    }
  }
});
}
}