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
    // Add input restriction for email field
    const emailInput = document.getElementById('email') as HTMLInputElement;
    if (emailInput) {
      emailInput.addEventListener('input', (e) => {
        const target = e.target as HTMLInputElement;
        // Only allow letters, numbers, dots, underscores, hyphens, and @
        target.value = target.value.replace(/[^a-zA-Z0-9._@-]/g, '');
      });
    }

    // Add toggle listener after view is initialized
    setTimeout(() => {
      const toggle = document.getElementById('togglePassword');
      const passwordInput = document.getElementById('password') as HTMLInputElement;

      console.log('Toggle element:', toggle);
      console.log('Password input:', passwordInput);

      if (toggle && passwordInput) {
        toggle.addEventListener('click', () => {
          console.log('Eye icon clicked!');
          const isPassword = passwordInput.type === "password";
          passwordInput.type = isPassword ? "text" : "password";
          
          // Toggle SVG icon visibility
          const eyeOpen = toggle.querySelector('.eye-open') as HTMLElement;
          const eyeClosed = toggle.querySelector('.eye-closed') as HTMLElement;
          
          console.log('Eye open:', eyeOpen, 'Eye closed:', eyeClosed);
          
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
        console.log('Event listener attached successfully');
      } else {
        console.error('Elements not found!');
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