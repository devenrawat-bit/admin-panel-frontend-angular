import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from './toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div 
        *ngFor="let toast of toasts" 
        class="toast toast-{{toast.type}}"
      >
        <div class="toast-icon">
          <i class="fa-solid" [ngClass]="{
            'fa-circle-check': toast.type === 'success',
            'fa-circle-xmark': toast.type === 'error',
            'fa-circle-info': toast.type === 'info',
            'fa-triangle-exclamation': toast.type === 'warning'
          }"></i>
        </div>
        <div class="toast-message">{{ toast.message }}</div>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      pointer-events: none;
    }

    .toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 12px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 400px;
      animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
      pointer-events: auto;
      font-size: 14px;
      font-weight: 500;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    @keyframes fadeOut {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }

    .toast-success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .toast-error {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .toast-info {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .toast-warning {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .toast-icon {
      font-size: 20px;
      display: flex;
      align-items: center;
    }

    .toast-message {
      flex: 1;
      line-height: 1.4;
    }

    @media (max-width: 768px) {
      .toast-container {
        top: 10px;
        right: 10px;
        left: 10px;
      }

      .toast {
        min-width: auto;
        max-width: none;
      }
    }
  `]
})
export class ToastComponent implements OnInit {
  toasts: Toast[] = [];

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.toastService.toasts$.subscribe(toast => {
      console.log('Toast received:', toast);
      this.toasts.push(toast);
      
      // Auto remove after 3 seconds
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== toast.id);
      }, 3000);
    });
  }
}
