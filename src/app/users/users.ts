import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { UserService } from './user.service';
import { ModalService } from '../shared/modal/modal.service';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './users.html',
  styleUrls: ['./users.scss'],
})
export class Users {
  users: any[] = [];

  // Filters visible in UI
  filters = {
    name: '',
    email: '',
    phoneNumber: '',
    role: '',
    isActive: ''
  };

  // Pagination
  page = 1;
  pageSize = 10;
  totalItems = 0;

  // Sorting - default to CreatedAt descending (newest first)
  sortColumn = 'CreatedAt';
  sortDirection: 'asc' | 'desc' = 'desc';

  loading = false;

  constructor(
    private userService: UserService,
    private router: Router,
    private modalService: ModalService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  // 👉 FIXED GETTERS (pagination display)
  get startIndex() {
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex() {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

 loadUsers() {
  this.loading = true;

  const payload = {
    page: this.page,
    pageSize: this.pageSize,
    search: "",
    sortColumn: this.sortColumn,
    sortDirection: this.sortDirection,
    filters: {
      fullName: this.filters.name || "",
      email: this.filters.email || "",
      phoneNumber: this.filters.phoneNumber || "",
      roles: this.filters.role || "",
      isActive: this.filters.isActive || ""
    }
  };

  console.log("🔍 Loading users with payload:", payload);

  this.userService.getUsers(payload).subscribe({
    next: (response: any) => {
      console.log("📨 Raw response from backend:", response);
      console.log("📨 Response type:", typeof response);
      console.log("📨 Response keys:", Object.keys(response || {}));
      
      // Try multiple response structure possibilities
      let data: any[] = [];
      let total: number = 0;

      // Structure 1: { data: [], totalCount: number }
      if (response?.data && Array.isArray(response.data)) {
        data = response.data;
        total = response.totalCount || response.totalItems || response.data.length || 0;
        console.log("✅ Format 1: Using response.data");
      }
      // Structure 2: { Data: [], TotalCount: number } (PascalCase)
      else if (response?.Data && Array.isArray(response.Data)) {
        data = response.Data;
        total = response.TotalCount || response.TotalItems || response.Data.length || 0;
        console.log("✅ Format 2: Using response.Data (PascalCase)");
      }
      // Structure 3: { message: { data: [] } }
      else if (response?.message?.data && Array.isArray(response.message.data)) {
        data = response.message.data;
        total = response.message.totalCount || response.message.totalItems || response.message.data.length || 0;
        console.log("✅ Format 3: Using response.message.data");
      }
      // Structure 4: Direct array response
      else if (Array.isArray(response)) {
        data = response;
        total = response.length;
        console.log("✅ Format 4: Direct array response");
      }
      // Structure 5: { success: true, data: [] }
      else if (response?.success && response?.data && Array.isArray(response.data)) {
        data = response.data;
        total = response.totalCount || response.data.length || 0;
        console.log("✅ Format 5: Using response.data with success flag");
      }

      console.log("✅ Extracted users:", data);
      console.log("✅ Total count:", total);
      
      this.users = data;
      this.totalItems = total;
      this.loading = false;
    },
    error: (err: any) => {
      console.error("❌ Error loading users:", err);
      console.error("❌ Error status:", err.status);
      console.error("❌ Error message:", err.message);
      this.users = [];
      this.totalItems = 0;
      this.loading = false;
    }
  });
}

  changePageSize(size: any) {
    this.pageSize = Number(size);
    this.page = 1;
    this.loadUsers();
  }

  nextPage() {
    if (this.page * this.pageSize < this.totalItems) {
      this.page++;
      this.loadUsers();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadUsers();
    }
  }

  clearFilters() {
    this.filters = {
      name: '',
      email: '',
      phoneNumber: '',
      role: '',
      isActive: ''
    };
    this.page = 1;
    this.loadUsers();
  }

  // Sorting methods
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadUsers();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  getRoleDisplay(user: any): string {
    if (Array.isArray(user.roles)) {
      return user.roles.join(', ');
    }
    return user.roles || '';
  }

  toggleActive(user: any) {
    console.log('🔄 Toggling user active status:', user);
    
    const fd = new FormData();
    
    fd.append('Email', user.email || '');
    fd.append('FullName', user.fullName || '');
    fd.append('Role', this.getRoleDisplay(user));
    fd.append('isActive', (!user.isActive).toString());
    fd.append('PhoneNumber', user.phoneNumber || '');
    fd.append('DateOfBirth', user.dateOfBirth || '');
    fd.append('CountryId', user.countryId ?? '');
    fd.append('StateId', user.stateId ?? '');
    fd.append('CityId', user.cityId ?? '');

    console.log('📤 Sending update with FormData for user ID:', user.id);
    fd.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    this.userService.updateUser(user.id, fd).subscribe({
      next: (response) => {
        console.log('✅ User status updated successfully:', response);
        user.isActive = !user.isActive;
        this.toastService.success(`User ${user.isActive ? 'activated' : 'deactivated'} successfully`);
      },
      error: (err) => {
        console.error('❌ Error toggling user active status:', err);
        console.error('❌ Error details:', err.error);
        const errorMsg = err.error?.message || err.error?.title || 'Error updating user status';
        this.toastService.error(errorMsg);
      }
    });
  }

  addUser() {
    this.router.navigate(['/users/add']);
  }

  editUser(user: any) {
    this.router.navigate(['/users/edit', user.id]);
  }

  async deleteUser(user: any) {
    const confirmed = await this.modalService.confirm(
      'Delete User',
      `Are you sure you want to delete "${user.fullName}"?`
    );

    if (!confirmed) return;

    this.userService.deleteUser(user.id).subscribe({
      next: () => {
        this.modalService.success('Success', 'User deleted successfully');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Error deleting user', err);
        this.modalService.success('Error', 'Failed to delete user');
      }
    });
  }
}
