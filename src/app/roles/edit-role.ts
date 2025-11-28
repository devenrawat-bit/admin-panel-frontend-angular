// src/app/roles/edit-role.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  PERMISSION_GROUPS,
  PermissionGroup,
  PermissionOption,
  decodePermissionsToArray,
} from './permission.enum';
import { RoleService } from './role.service';

@Component({
  selector: 'app-edit-role',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './edit-role.html',
  styleUrls: ['./edit-role.scss'],
})
export class EditRole {
  mode: 'add' | 'edit' = 'add';
  roleId: string | null = null;

  // form fields
  name = '';
  description = '';
  isActive = true;

  loading = false;
  saving = false;

  // permissions
  permissionGroups: PermissionGroup[] = PERMISSION_GROUPS;
  expandedGroups: Record<string, boolean> = {};
  selectedPermissions = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService
  ) {}

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      this.roleId = id;
      this.mode = id ? 'edit' : 'add';

      // by default all groups collapsed
      this.permissionGroups.forEach((g) => (this.expandedGroups[g.key] = false));

      if (this.mode === 'edit' && this.roleId) {
        this.loadRole(this.roleId);
      }
    });
  }

  loadRole(id: string) {
    this.loading = true;
    this.roleService.getRoleById(id).subscribe({
      next: (res) => {
        const data = res?.data;
        if (!data) {
          alert('Role not found');
          this.router.navigate(['/roles']);
          return;
        }

        this.name = data.name || '';
        this.description = data.description || '';
        this.isActive = data.isActive === true;

        const permsInt: number = data.permissions ?? 0;
        const arr = decodePermissionsToArray(permsInt);
        this.selectedPermissions = new Set(arr);

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading role by id', err);
        this.loading = false;
        alert('Error loading role');
      },
    });
  }

  // permission helpers

  isPermissionChecked(option: PermissionOption): boolean {
    return this.selectedPermissions.has(option.value);
  }

  onPermissionToggle(option: PermissionOption, checked: boolean) {
    if (checked) {
      this.selectedPermissions.add(option.value);
    } else {
      this.selectedPermissions.delete(option.value);
    }
  }

  isGroupAllChecked(group: PermissionGroup): boolean {
    return group.items.every((opt) => this.selectedPermissions.has(opt.value));
  }

  toggleGroup(group: PermissionGroup, checked: boolean) {
    group.items.forEach((opt) => {
      if (checked) {
        this.selectedPermissions.add(opt.value);
      } else {
        this.selectedPermissions.delete(opt.value);
      }
    });
  }

  checkAll() {
    const allSelected =
      this.permissionGroups.every((g) =>
        g.items.every((opt) => this.selectedPermissions.has(opt.value))
      );

    if (allSelected) {
      // unselect all
      this.selectedPermissions.clear();
    } else {
      // select all
      this.permissionGroups.forEach((g) =>
        g.items.forEach((opt) => this.selectedPermissions.add(opt.value))
      );
    }
  }

  expandAll() {
    const allExpanded = Object.values(this.expandedGroups).every((x) => x);
    this.permissionGroups.forEach(
      (g) => (this.expandedGroups[g.key] = !allExpanded)
    );
  }

  toggleGroupCollapse(group: PermissionGroup) {
    this.expandedGroups[group.key] = !this.expandedGroups[group.key];
  }

  // submit

  save() {
    if (!this.name || this.name.trim().length === 0) {
      alert('Role name is required');
      return;
    }

    this.saving = true;

    const permissionsArray = Array.from(this.selectedPermissions);

    if (this.mode === 'add') {
      const body = {
        name: this.name.trim(),
        description: this.description?.trim() || '',
        isActive: this.isActive,
        permissions: permissionsArray,
      };

      this.roleService.addRole(body).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Error adding role', err);
          this.saving = false;
          alert('Error adding role');
        },
      });
    } else if (this.mode === 'edit' && this.roleId) {
      const body = {
        name: this.name.trim(),
        description: this.description?.trim() || '',
        isActive: this.isActive,
        permissions: permissionsArray,
      };

      this.roleService.updateRole(this.roleId, body).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/roles']);
        },
        error: (err) => {
          console.error('Error updating role', err);
          this.saving = false;
          alert('Error updating role');
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/roles']);
  }
}
