import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Auth } from '../auth/auth';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss'],
})
export class Sidebar implements OnInit {
  @Input() collapsed = false;

  user = {
    name: "Dharmesh",
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
    // Load user info from localStorage
    const fullName = localStorage.getItem('fullName');
    const roles = localStorage.getItem('roles');
    const profileUrl = localStorage.getItem('profileImageUrl');
    
    if (fullName) this.user.name = fullName;
    if (roles) this.user.role = roles;
    if (profileUrl) this.user.profileImage = profileUrl;
  }
}
