import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RoleService, RoleDto } from './role.service';
import { ModalService } from '../shared/modal/modal.service';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './roles.html',
  styleUrls: ['./roles.scss'],
})
export class Roles {
  roles: RoleDto[] = [];

  // filters
  searchName = '';
  searchDescription = '';
  searchActive: string = '';

  // pagination
  page = 1;
  pageSize = 10;
  totalItems = 0;

  // sorting - default to CreatedOn descending (newest first)
  sortColumn: string = 'CreatedOn';
  sortDirection: 'asc' | 'desc' = 'desc';

  loading = false;

  constructor(
    private roleService: RoleService,
    private router: Router,
    private modalService: ModalService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Check if we need to reset sorting (after creating a new role)
    if (localStorage.getItem('role_reset_sort')) {
      this.sortColumn = 'CreatedOn';
      this.sortDirection = 'desc';
      this.page = 1;
      localStorage.removeItem('role_reset_sort');
    }
    
    console.log('🔍 Initial sort settings:', {
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    });
    
    this.loadRoles();
  }

  loadRoles() {
    this.loading = true;

    const payload = {
      page: this.page,
      pageSize: this.pageSize,
      search: '',
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      filters: {
        name: this.searchName || '',
        description: this.searchDescription || '',
        isActive: this.searchActive || '',
      },
    };

    console.log('📤 Roles request payload:', payload);

    this.roleService.getRoles(payload).subscribe({
      next: (res) => {
        let data: any[] = [];
        let total = 0;

        if (res?.data?.data?.data) {
          data = res.data.data.data;
          total = res.data.data.totalItems ?? data.length ?? 0;
        } else if (Array.isArray(res as any)) {
          data = res as any;
          total = data.length;
        }

        this.roles = data.map((r: any) => ({
          id: r.id,
          name: r.name,
          description: r.description ?? '',
          isActive: r.isActive === true,
          // FIXED: always convert to number[]
          permissions: Array.isArray(r.permissions)
            ? r.permissions
            : [r.permissions ?? 0],
        }));

        this.totalItems = total;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error loading roles:', err);
        this.roles = [];
        this.totalItems = 0;
        this.loading = false;
      },
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadRoles();
  }

  clearFilters() {
    this.searchName = '';
    this.searchDescription = '';
    this.searchActive = '';
    this.page = 1;
    this.loadRoles();
  }

  sortBy(column: 'name' | 'description' | 'isActive') {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadRoles();
  }

  getSortIcon(column: string) {
    if (this.sortColumn !== column) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  get startIndex() {
    if (this.totalItems === 0) return 0;
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex() {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  changePageSize(size: any) {
    this.pageSize = Number(size);
    this.page = 1;
    this.loadRoles();
  }

  nextPage() {
    if (this.page * this.pageSize < this.totalItems) {
      this.page++;
      this.loadRoles();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadRoles();
    }
  }

  goToAdd() {
    this.router.navigate(['/roles/add']);
  }

  goToEdit(role: RoleDto) {
    this.router.navigate(['/roles/edit', role.id]);
  }

  async deleteRole(role: RoleDto) {
    const confirmed = await this.modalService.confirm(
      'Delete Role',
      `Are you sure you want to delete "${role.name}"?`
    );

    if (!confirmed) return;

    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.modalService.success('Success', 'Role deleted successfully');
        this.loadRoles();
      },
      error: (err) => {
        console.error('❌ Error deleting role:', err);
        this.modalService.success('Error', 'Failed to delete role');
      },
    });
  }

  // ⭐ FINAL FIXED TOGGLE (NO MORE ERROR)
  toggleActive(role: RoleDto) {
    const newValue = !role.isActive;

    console.log('=== TOGGLE ROLE STATUS ===');
    console.log('Role:', role);
    console.log('New Value:', newValue);

    const body = {
      name: role.name,
      description: role.description ?? '',
      isActive: newValue,
      permissions: Array.isArray(role.permissions)
        ? role.permissions
        : [role.permissions ?? 0],
    };

    console.log('Update Body:', body);

    this.roleService.updateRole(role.id, body).subscribe({
      next: (response) => {
        console.log('=== TOGGLE SUCCESS ===');
        console.log('Response:', response);
        role.isActive = newValue;
        this.toastService.success(`Role ${newValue ? 'activated' : 'deactivated'} successfully`);
      },
      error: (err) => {
        console.error('=== TOGGLE ERROR ===');
        console.error('Full Error:', err);
        console.error('Status:', err.status);
        console.error('Error Body:', err.error);
        console.error('Validation Errors Detail:', err.error?.errors);
        
        let errorMessage = 'Error updating role status';
        
        // Extract specific validation error
        if (err.error?.errors) {
          const errorDetails = Object.entries(err.error.errors)
            .map(([field, messages]: [string, any]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgs.join(', ')}`;
            })
            .join('\n');
          errorMessage = errorDetails;
          console.error('Formatted Errors:', errorDetails);
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (err.error?.Message) {
          errorMessage = err.error.Message;
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        }
        
        this.toastService.error(errorMessage);
      },
    });
  }
}
