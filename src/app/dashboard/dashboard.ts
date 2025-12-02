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
  loading = true;
  loadingUsers = true;
  loadingRoles = true;

  userStats: UserStats = { activeUsers: 0, inactiveUsers: 0, totalUsers: 0 };
  roleStats: RoleStats = { activeRoles: 0, inactiveRoles: 0, totalRoles: 0 };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadUserStats();
    this.loadRoleStats();
  }

  checkLoadingComplete() {
    if (!this.loadingUsers && !this.loadingRoles) {
      this.loading = false;
    }
  }

  loadUserStats() {
    // Use optimized stats endpoint instead of loading full user data
    this.http.get<any>('https://localhost:7065/api/User/stats')
      .subscribe({
        next: (res) => {
          console.log('Dashboard User Stats Response:', res);
          
          // Handle different response structures
          const stats = res?.data || res;
          
          this.userStats = {
            activeUsers: stats.activeUsers || stats.ActiveUsers || 0,
            inactiveUsers: stats.inactiveUsers || stats.InactiveUsers || 0,
            totalUsers: stats.totalUsers || stats.TotalUsers || 0
          };
          
          this.totalUsers = this.userStats.totalUsers;
          
          console.log('User Stats:', this.userStats);
          this.loadingUsers = false;
          this.checkLoadingComplete();
        },
        error: (err) => {
          console.error('Error loading user stats:', err);
          // Fallback to old method if stats endpoint doesn't exist yet
          this.loadUserStatsLegacy();
        }
      });
  }

  // Fallback method if backend stats endpoint is not ready yet
  loadUserStatsLegacy() {
    const payload = {
      page: 1,
      pageSize: 10,
      search: '',
      sortColumn: 'CreatedAt',
      sortDirection: 'desc',
      filters: {}
    };

    this.http.post<any>('https://localhost:7065/api/User/get-users', payload)
      .subscribe(res => {
        let totalCount = 0;
        let users: any[] = [];
        
        if (res?.message?.data && Array.isArray(res.message.data)) {
          users = res.message.data;
          totalCount = res.message.totalCount || res.message.totalItems || res.totalItems || 0;
        } else if (res?.data && Array.isArray(res.data)) {
          users = res.data;
          totalCount = res.totalCount || res.totalItems || 0;
        } else if (res?.Data && Array.isArray(res.Data)) {
          users = res.Data;
          totalCount = res.TotalCount || res.TotalItems || 0;
        } else if (Array.isArray(res)) {
          users = res;
          totalCount = res.length;
        }
        
        const activeUsers = users.filter((u: any) => u.isActive === true).length;
        const inactiveUsers = users.filter((u: any) => u.isActive === false).length;
        const sampleTotal = users.length;
        
        const activePercentage = sampleTotal > 0 ? activeUsers / sampleTotal : 1;
        const inactivePercentage = sampleTotal > 0 ? inactiveUsers / sampleTotal : 0;
        
        this.userStats = {
          activeUsers: Math.round(totalCount * activePercentage),
          inactiveUsers: Math.round(totalCount * inactivePercentage),
          totalUsers: totalCount
        };
        
        this.totalUsers = totalCount;
        this.loadingUsers = false;
        this.checkLoadingComplete();
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
        
        this.totalRoles = roles.length;
        
        console.log('Role Stats:', this.roleStats);
        this.loadingRoles = false;
        this.checkLoadingComplete();
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
