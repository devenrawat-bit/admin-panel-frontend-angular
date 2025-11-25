import { Component, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login implements AfterViewInit {

  constructor() {}

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

    console.log("Payload", { email, password });
  }
}