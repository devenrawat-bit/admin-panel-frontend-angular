import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalService, ModalConfig } from './modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss']
})
export class ModalComponent {
  config: ModalConfig | null = null;

  constructor(public modalService: ModalService) {
    this.modalService.modalState$.subscribe((config) => {
      this.config = config;
    });
  }

  confirm() {
    this.modalService.onConfirm();
  }

  cancel() {
    this.modalService.onCancel();
  }

  close() {
    this.modalService.close();
  }
}
