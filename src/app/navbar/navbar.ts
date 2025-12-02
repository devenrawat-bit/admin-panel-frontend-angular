import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss',
})
export class Navbar implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();
  
  user = {
    name: "User",
    role: "Admin",
    profileImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23667eea'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"
  };

  showProfileMenu = false;

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    // Load user info from localStorage
    const fullName = localStorage.getItem('fullName');
    const roles = localStorage.getItem('roles');
    const profileUrl = localStorage.getItem('profileImageUrl');
    
    if (fullName) this.user.name = fullName;
    if (roles) this.user.role = roles;
    if (profileUrl) {
      if (profileUrl.startsWith('http')) {
        this.user.profileImage = profileUrl;
      } else {
        const cleanUrl = profileUrl.startsWith('/') ? profileUrl.substring(1) : profileUrl;
        this.user.profileImage = `https://localhost:7065/${cleanUrl}`;
      }
    }
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  toggleProfileMenu() {
    this.showProfileMenu = !this.showProfileMenu;
  }

  closeProfileMenu() {
    this.showProfileMenu = false;
  }

  onLogout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
