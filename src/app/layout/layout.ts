import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';
import { Sidebar } from '../sidebar/sidebar';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, Navbar, Sidebar],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
})
export class Layout {
  sidebarCollapsed = false; // Start expanded by default

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }
}
