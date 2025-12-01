import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ModalComponent } from './shared/modal/modal.component';
import { ToastComponent } from './shared/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ModalComponent, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('admin-panel');
}
