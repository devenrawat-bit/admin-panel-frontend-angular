// src/app/roles/roles.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { RoleService, RoleDto } from './role.service';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  // sorting
  sortColumn: string = 'name';
  sortDirection: 'asc' | 'desc' = 'asc';

  loading = false;

  constructor(
    private roleService: RoleService,
    private router: Router
  ) {}

  ngOnInit() {
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

  deleteRole(role: RoleDto) {
    if (!confirm(`Delete role "${role.name}" ?`)) return;

    this.roleService.deleteRole(role.id).subscribe({
      next: () => {
        this.loadRoles();
      },
      error: (err) => {
        console.error('❌ Error deleting role:', err);
        alert('Error deleting role');
      },
    });
  }

  // ⭐ FINAL FIXED TOGGLE (NO MORE ERROR)
  toggleActive(role: RoleDto) {
    const newValue = !role.isActive;

    const body = {
      name: role.name,
      description: role.description ?? '',
      isActive: newValue,
      permissions: Array.isArray(role.permissions)
        ? role.permissions
        : [role.permissions ?? 0],  // FIXED HERE
    };

    this.roleService.updateRole(role.id, body).subscribe({
      next: () => {
        role.isActive = newValue;
      },
      error: (err) => {
        console.error('❌ Error toggling isActive:', err);
        alert('Error updating role status');
      },
    });
  }
}
