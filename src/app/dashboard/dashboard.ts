import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

interface UserStats {
  activeUsers: number;
  inactiveUsers: number;
  totalUsers: number;
}

interface RoleStats {
  activeRoles: number;
  inactiveRoles: number;
  totalRoles: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
})
export class Dashboard {

  totalUsers = 0;
  totalRoles = 0;

  userStats: UserStats = { activeUsers: 0, inactiveUsers: 0, totalUsers: 0 };
  roleStats: RoleStats = { activeRoles: 0, inactiveRoles: 0, totalRoles: 0 };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadStats();
    this.loadUserStats();
    this.loadRoleStats();
  }

  loadStats() {
    // Don't use count-users endpoint as it includes deleted users
    // We'll get the count from loadUserStats instead
    
    // GET total Roles
    this.http.get<any>('https://localhost:7065/api/Role/count-roles')
      .subscribe(res => {
        this.totalRoles = res?.total ?? 0;
      });
  }

  loadUserStats() {
    const payload = {
      page: 1,
      pageSize: 1000,
      search: '',
      sortColumn: 'CreatedAt',
      sortDirection: 'desc',
      filters: {}
    };

    this.http.post<any>('https://localhost:7065/api/User/get-users', payload)
      .subscribe(res => {
        console.log('Dashboard User Stats Response:', res);
        
        // Extract users from response (same logic as users component)
        let users: any[] = [];
        
        if (res?.message?.data && Array.isArray(res.message.data)) {
          users = res.message.data;
        } else if (res?.data && Array.isArray(res.data)) {
          users = res.data;
        } else if (res?.Data && Array.isArray(res.Data)) {
          users = res.Data;
        } else if (Array.isArray(res)) {
          users = res;
        }
        
        console.log('Extracted users:', users);
        
        const activeUsers = users.filter((u: any) => u.isActive === true).length;
        const inactiveUsers = users.filter((u: any) => u.isActive === false).length;
        
        this.userStats = {
          activeUsers,
          inactiveUsers,
          totalUsers: users.length
        };
        
        // Update the total users count (excluding deleted users)
        this.totalUsers = users.length;
        
        console.log('User Stats:', this.userStats);
      });
  }

  loadRoleStats() {
    const payload = {
      page: 1,
      pageSize: 1000,
      search: '',
      sortColumn: 'Name',
      sortDirection: 'asc',
      filters: {}
    };

    this.http.post<any>('https://localhost:7065/api/Role/get-roles', payload)
      .subscribe(res => {
        let roles = [];
        
        if (res?.data?.data?.data) {
          roles = res.data.data.data;
        } else if (Array.isArray(res)) {
          roles = res;
        }
        
        const activeRoles = roles.filter((r: any) => r.isActive === true).length;
        const inactiveRoles = roles.filter((r: any) => r.isActive === false).length;
        
        this.roleStats = {
          activeRoles,
          inactiveRoles,
          totalRoles: roles.length
        };
      });
  }

  getUserActivePercentage(): number {
    if (this.userStats.totalUsers === 0) return 0;
    return Math.round((this.userStats.activeUsers / this.userStats.totalUsers) * 100);
  }

  getUserInactivePercentage(): number {
    if (this.userStats.totalUsers === 0) return 0;
    return Math.round((this.userStats.inactiveUsers / this.userStats.totalUsers) * 100);
  }

  getRoleActivePercentage(): number {
    if (this.roleStats.totalRoles === 0) return 0;
    return Math.round((this.roleStats.activeRoles / this.roleStats.totalRoles) * 100);
  }

  getRoleInactivePercentage(): number {
    if (this.roleStats.totalRoles === 0) return 0;
    return Math.round((this.roleStats.inactiveRoles / this.roleStats.totalRoles) * 100);
  }
}
