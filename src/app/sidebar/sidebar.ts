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
    profileImage: "assets/user.jpg"
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
      this.user.profileImage = profileUrl;
    }
    
    console.log("Sidebar user data loaded:", this.user);
  }
}
