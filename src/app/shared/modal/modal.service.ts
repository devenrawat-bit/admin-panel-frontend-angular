import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ModalConfig {
  type: 'confirm' | 'success' | 'error';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  private modalState = new Subject<ModalConfig | null>();
  private confirmResult = new Subject<boolean>();

  modalState$ = this.modalState.asObservable();

  confirm(title: string, message: string): Promise<boolean> {
    this.modalState.next({
      type: 'confirm',
      title,
      message,
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel'
    });

    return new Promise((resolve) => {
      const sub = this.confirmResult.subscribe((result) => {
        resolve(result);
        sub.unsubscribe();
        this.close();
      });
    });
  }

  success(title: string, message: string): Promise<void> {
    this.modalState.next({
      type: 'success',
      title,
      message,
      confirmText: 'OK'
    });

    return new Promise((resolve) => {
      const sub = this.confirmResult.subscribe(() => {
        resolve();
        sub.unsubscribe();
        this.close();
      });
    });
  }

  close() {
    this.modalState.next(null);
  }

  onConfirm() {
    this.confirmResult.next(true);
  }

  onCancel() {
    this.confirmResult.next(false);
    this.close();
  }
}
