import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
  changeDetection: ChangeDetectionStrategy.Default,
})
export class Sidebar implements OnInit {
  @Input() collapsed = false;

  user = {
    name: "User",
    role: "Admin",
    profileImage: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23667eea'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E"
  };

  menuItems = [
    { icon: 'fa-solid fa-house', label: 'Dashboard', route: '/dashboard' },
    { icon: 'fa-solid fa-users', label: 'Users', route: '/users' },
    { icon: 'fa-solid fa-user-shield', label: 'Roles', route: '/roles' },
    { icon: 'fa-solid fa-file', label: 'CMS', route: '/cms' },
    { icon: 'fa-solid fa-circle-question', label: 'FAQ', route: '/faq' }
  ];

  constructor(private auth: Auth) {}

  ngOnInit() {
    // Load user info from localStorage immediately
    this.loadUserData();
    console.log("Sidebar initialized with user:", this.user);
  }

  private loadUserData() {
    const fullName = localStorage.getItem('fullName');
    const roles = localStorage.getItem('roles');
    const profileUrl = localStorage.getItem('profileImageUrl');
    
    console.log("Loading sidebar user data from localStorage:", { fullName, roles, profileUrl });
    
    if (fullName && fullName.trim()) {
      this.user.name = fullName;
    }
    if (roles && roles.trim()) {
      this.user.role = roles;
    }
    if (profileUrl && profileUrl.trim()) {
      if (profileUrl.startsWith('http')) {
        this.user.profileImage = profileUrl;
      } else {
        const cleanUrl = profileUrl.startsWith('/') ? profileUrl.substring(1) : profileUrl;
        this.user.profileImage = `https://localhost:7065/${cleanUrl}`;
      }
    }
    
    console.log("Sidebar user data loaded:", this.user);
  }
}
