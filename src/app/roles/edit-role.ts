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
import { ToastService } from '../shared/toast/toast.service';

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

  // Validation messages
  successMessage = '';
  errorMessage = '';
  validationErrors: { [key: string]: string } = {};

  // permissions
  permissionGroups: PermissionGroup[] = PERMISSION_GROUPS;
  expandedGroups: Record<string, boolean> = {};
  selectedPermissions = new Set<number>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private roleService: RoleService,
    private toastService: ToastService
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
    console.log('=== SAVE ROLE CLICKED ===');
    console.log('Role Name:', this.name);
    console.log('Description:', this.description);
    console.log('Is Active:', this.isActive);
    console.log('Selected Permissions:', Array.from(this.selectedPermissions));
    
    // Clear previous messages
    this.successMessage = '';
    this.errorMessage = '';
    this.validationErrors = {};

    // Client-side validation - collect all errors
    let hasErrors = false;

    // Validate name
    if (!this.name || this.name.trim().length === 0) {
      this.validationErrors['name'] = 'Role name is required';
      hasErrors = true;
    } else if (this.name.trim().length < 2) {
      this.validationErrors['name'] = 'Role name must be at least 2 characters';
      hasErrors = true;
    } else if (this.name.trim().length > 50) {
      this.validationErrors['name'] = 'Role name cannot exceed 50 characters';
      hasErrors = true;
    }

    // Validate description
    if (!this.description || this.description.trim().length === 0) {
      this.validationErrors['description'] = 'Short description is required';
      hasErrors = true;
    } else if (this.description.trim().length < 10) {
      this.validationErrors['description'] = 'Short description must be at least 10 characters';
      hasErrors = true;
    } else if (this.description.trim().length > 100) {
      this.validationErrors['description'] = 'Short description cannot exceed 100 characters';
      hasErrors = true;
    }

    // If there are validation errors, stop here
    if (hasErrors) {
      this.errorMessage = 'Please fix the validation errors below';
      return;
    }

    this.saving = true;

    const permissionsArray = Array.from(this.selectedPermissions);
    console.log('Permissions Array:', permissionsArray);

    if (this.mode === 'add') {
      const body = {
        name: this.name.trim(),
        description: this.description?.trim() || '',
        isActive: this.isActive,
        permissions: permissionsArray,
      };

      console.log('=== ADD ROLE REQUEST ===');
      console.log('Request Body:', body);

      this.roleService.addRole(body).subscribe({
        next: (response) => {
          console.log('=== ADD ROLE SUCCESS ===');
          console.log('Response:', response);
          this.saving = false;
          
          // Show toast notification
          this.toastService.show(response?.message || 'Role created successfully', 'success');
          
          // Redirect after 2 seconds
          setTimeout(() => {
            localStorage.setItem('role_reset_sort', 'true');
            this.router.navigate(['/roles']).then(() => {
              window.location.reload();
            });
          }, 2000);
        },
        error: (err) => {
          console.error('=== ADD ROLE ERROR ===');
          console.error('Full Error:', err);
          console.error('Status:', err.status);
          console.error('Error Body:', err.error);
          console.error('Validation Errors:', err.error?.errors);
          
          this.saving = false;
          
          // Handle validation errors from backend
          if (err.error?.errors) {
            // ASP.NET validation errors
            Object.entries(err.error.errors).forEach(([field, messages]: [string, any]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              const fieldName = field.toLowerCase();
              this.validationErrors[fieldName] = msgs.join(', ');
            });
            this.errorMessage = 'Please fix the validation errors below';
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else if (err.error?.Message) {
            this.errorMessage = err.error.Message;
          } else if (typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else if (err.error?.title) {
            this.errorMessage = err.error.title;
          } else {
            this.errorMessage = 'Error adding role. Please try again.';
          }
          
          console.log('Error Message:', this.errorMessage);
          console.log('Validation Errors:', this.validationErrors);
        },
      });
    } else if (this.mode === 'edit' && this.roleId) {
      const body = {
        name: this.name.trim(),
        description: this.description?.trim() || '',
        isActive: this.isActive,
        permissions: permissionsArray,
      };

      console.log('=== UPDATE ROLE REQUEST ===');
      console.log('Role ID:', this.roleId);
      console.log('Request Body:', body);

      this.roleService.updateRole(this.roleId, body).subscribe({
        next: (response) => {
          console.log('=== UPDATE ROLE SUCCESS ===');
          console.log('Response:', response);
          this.saving = false;
          
          // Show toast notification
          this.toastService.show(response?.message || 'Role updated successfully', 'success');
          
          // Redirect after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/roles']);
          }, 2000);
        },
        error: (err) => {
          console.error('=== UPDATE ROLE ERROR ===');
          console.error('Full Error:', err);
          console.error('Status:', err.status);
          console.error('Error Body:', err.error);
          
          this.saving = false;
          
          // Handle validation errors from backend
          if (err.error?.errors) {
            Object.entries(err.error.errors).forEach(([field, messages]: [string, any]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              const fieldName = field.toLowerCase();
              this.validationErrors[fieldName] = msgs.join(', ');
            });
            this.errorMessage = 'Please fix the validation errors below';
          } else if (err.error?.message) {
            this.errorMessage = err.error.message;
          } else if (err.error?.Message) {
            this.errorMessage = err.error.Message;
          } else if (typeof err.error === 'string') {
            this.errorMessage = err.error;
          } else {
            this.errorMessage = 'Error updating role. Please try again.';
          }
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/roles']);
  }

  // Blur validation methods
  onNameBlur() {
    // Clear previous error
    delete this.validationErrors['name'];

    if (!this.name || this.name.trim().length === 0) {
      this.validationErrors['name'] = 'Role name is required';
      return;
    }

    if (this.name.trim().length < 2) {
      this.validationErrors['name'] = 'Role name must be at least 2 characters';
      return;
    }

    if (this.name.trim().length > 50) {
      this.validationErrors['name'] = 'Role name cannot exceed 50 characters';
      return;
    }
  }

  onDescriptionBlur() {
    // Clear previous error
    delete this.validationErrors['description'];

    if (!this.description || this.description.trim().length === 0) {
      this.validationErrors['description'] = 'Short description is required';
      return;
    }

    if (this.description.trim().length < 10) {
      this.validationErrors['description'] = 'Short description must be at least 10 characters';
      return;
    }

    if (this.description.trim().length > 100) {
      this.validationErrors['description'] = 'Short description cannot exceed 100 characters';
      return;
    }
  }

  // Dynamic validation methods (trigger on input)
  onNameInput() {
    // Clear previous error
    delete this.validationErrors['name'];

    // Only validate if field has content
    if (this.name && this.name.trim().length > 0) {
      if (this.name.trim().length < 2) {
        this.validationErrors['name'] = 'Role name must be at least 2 characters';
      } else if (this.name.trim().length > 50) {
        this.validationErrors['name'] = 'Role name cannot exceed 50 characters';
      }
    }
  }

  onDescriptionInput() {
    // Clear previous error
    delete this.validationErrors['description'];

    // Only validate if field has content
    if (this.description && this.description.trim().length > 0) {
      if (this.description.trim().length < 10) {
        this.validationErrors['description'] = 'Short description must be at least 10 characters';
      } else if (this.description.trim().length > 100) {
        this.validationErrors['description'] = 'Short description cannot exceed 100 characters';
      }
    }
  }
}
