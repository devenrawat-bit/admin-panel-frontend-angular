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
    name: "Dharmesh",
    profileImage: "assets/user.jpg"
  };

  showProfileMenu = false;

  constructor(private auth: Auth, private router: Router) {}

  ngOnInit() {
    // Load user info from localStorage
    const fullName = localStorage.getItem('fullName');
    const profileUrl = localStorage.getItem('profileImageUrl');
    
    if (fullName) this.user.name = fullName;
    if (profileUrl) this.user.profileImage = profileUrl;
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
