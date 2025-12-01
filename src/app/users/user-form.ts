import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from './user.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-form.html',
  styleUrls: ['./user-form.scss'],
})
export class UserForm {

  mode: 'add' | 'edit' = 'add';
  userId: string | null = null;

  roles: any[] = [];
  countries: any[] = [];
  states: any[] = [];
  cities: any[] = [];

  previewUrl: string | ArrayBuffer | null = null;
  selectedFile: File | null = null;
  imageSizeError = '';

  loading = false;
  saving = false;
  successMessage = '';

  form: any;

  MAX_IMAGE_SIZE = 5 * 1024 * 1024;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.buildForm();

    this.userId = this.route.snapshot.paramMap.get('id');
    this.mode = this.userId ? 'edit' : 'add';

    if (this.mode === 'add') {
      this.form.get('password')?.setValidators([
        Validators.required,
        Validators.pattern(/^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/)
      ]);
    } else {
      this.form.get('password')?.clearValidators();
    }
    this.form.get('password')?.updateValueAndValidity();

    this.loadRoles();
    this.loadCountries();

    if (this.mode === 'edit' && this.userId) {
      this.loadUser(this.userId);
    }
  }

  // Allow only A–Z and space
  allowOnlyLetters(event: KeyboardEvent) {
    const char = event.key;
    const allowed = /^[A-Za-z ]$/;

    if (!allowed.test(char)) {
      event.preventDefault();
    }
  }

  // Allow only digits (0–9)
  allowOnlyNumbers(event: KeyboardEvent) {
    const char = event.key;
    const allowed = /^[0-9]$/;

    if (!allowed.test(char)) {
      event.preventDefault();
    }
  }

  buildForm() {
    this.form = this.fb.group({
      fullName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(50),
          Validators.pattern(/^[A-Za-z ]+$/)
        ]
      ],

      email: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/)
        ]
      ],

      password: ['', Validators.required], // Will be set conditionally in ngOnInit

      phoneNumber: ['', [Validators.required, Validators.pattern(/^\d{10,15}$/)]],

      role: ['', Validators.required],

      isActive: [true, Validators.required],

      dateOfBirth: ['', [Validators.required, this.validateDateOfBirth]],

      countryId: [null, Validators.required],
      stateId: [null, Validators.required],
      cityId: [null, Validators.required]
    });
  }

  validateDateOfBirth(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;

    const dob = new Date(control.value);
    const today = new Date();
    const age = today.getFullYear() - dob.getFullYear();

    if (age < 18) {
      return { minAge: true };
    }
    return null;
  }

  validateImageSize(file: File): boolean {
    if (file.size > this.MAX_IMAGE_SIZE) {
      this.imageSizeError = `Image size must be less than 5MB. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
      return false;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type)) {
      this.imageSizeError = 'Only JPEG, PNG, and WebP images are allowed';
      return false;
    }

    this.imageSizeError = '';
    return true;
  }

  loadRoles() {
    this.userService.getRoles().subscribe({
      next: (res) => {
        console.log('=== ROLES API RESPONSE ===');
        console.log('Full Response:', res);
        
        let rolesArray: any[] = [];

        // Handle nested response structure: { success: true, data: { Data: { Data: [roles] } } }
        if (res?.data?.Data?.Data && Array.isArray(res.data.Data.Data)) {
          rolesArray = res.data.Data.Data;
        } else if (res?.data?.data?.data && Array.isArray(res.data.data.data)) {
          rolesArray = res.data.data.data;
        } else if (res?.Data?.Data && Array.isArray(res.Data.Data)) {
          rolesArray = res.Data.Data;
        } else if (res?.data?.Data && Array.isArray(res.data.Data)) {
          rolesArray = res.data.Data;
        } else if (Array.isArray(res)) {
          rolesArray = res;
        } else if (res?.data && Array.isArray(res.data)) {
          rolesArray = res.data;
        } else if (res?.Data && Array.isArray(res.Data)) {
          rolesArray = res.Data;
        }

        console.log('Extracted Roles Array:', rolesArray);

        this.roles = rolesArray.map((r: any) => ({
          id: r.id || r.Id,
          name: r.name || r.Name || r.roleName || r.RoleName || r.role || r.Role
        }));
        
        console.log('Mapped Roles:', this.roles);
      },
      error: (err) => {
        console.error('=== ROLES API ERROR ===');
        console.error('Error:', err);
        console.error('Status:', err.status);
        console.error('Error Body:', err.error);
        this.roles = [];
      }
    });
  }

  loadCountries() {
    this.userService.getCountries().subscribe({
      next: (res) => {
        let countries: any[] = [];

        if (Array.isArray(res)) countries = res;
        else if (res?.data && Array.isArray(res.data)) countries = res.data;
        else if (res?.Data && Array.isArray(res.Data)) countries = res.Data;
        else if (res?.message && Array.isArray(res.message)) countries = res.message;

        this.countries = countries;
      },
      error: () => (this.countries = [])
    });
  }

  onCountryChange(evt: any) {
    const countryId = Number(evt.target.value);
    this.form.patchValue({ stateId: null, cityId: null });
    this.states = [];
    this.cities = [];

    if (!countryId) return;

    this.userService.getStates(countryId).subscribe({
      next: (res) => {
        let states: any[] = [];

        if (Array.isArray(res)) states = res;
        else if (res?.data && Array.isArray(res.data)) states = res.data;
        else if (res?.Data && Array.isArray(res.Data)) states = res.Data;
        else if (res?.message && Array.isArray(res.message)) states = res.message;

        this.states = states;
      }
    });
  }

  onStateChange(evt: any) {
    const stateId = Number(evt.target.value);
    this.form.patchValue({ cityId: null });
    this.cities = [];

    if (!stateId) return;

    this.userService.getCities(stateId).subscribe({
      next: (res) => {
        let cities: any[] = [];

        if (Array.isArray(res)) cities = res;
        else if (res?.data && Array.isArray(res.data)) cities = res.data;
        else if (res?.Data && Array.isArray(res.Data)) cities = res.Data;
        else if (res?.message && Array.isArray(res.message)) cities = res.message;

        this.cities = cities;
      }
    });
  }

  loadUser(id: string) {
    this.loading = true;

    this.userService.getUserById(id).subscribe({
      next: (res) => {
        console.log('=== LOAD USER RESPONSE ===');
        console.log('Full Response:', res);
        console.log('res.data:', res?.data);
        console.log('res.message:', res?.message);
        
        const u = res?.data?.[0] || res?.message?.data?.[0];

        console.log('Extracted User:', u);
        console.log('User Email:', u?.email);
        console.log('User FullName:', u?.fullName);

        if (!u) {
          alert("User not found");
          this.router.navigate(['/users']);
          return;
        }

        const formData = {
          fullName: u.fullName || '',
          email: u.email || '',
          phoneNumber: u.phoneNumber || '',
          role: Array.isArray(u.roles) ? u.roles[0] : u.roles || '',
          isActive: u.isActive !== false,
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.substring(0, 10) : '',
          countryId: u.countryId || null,
          stateId: u.stateId || null,
          cityId: u.cityId || null
        };

        console.log('Form Data to Patch:', formData);
        this.form.patchValue(formData);

        if (u.countryId) {
          this.userService.getStates(u.countryId).subscribe({
            next: (res) => {
              let states: any[] = [];

              if (Array.isArray(res)) states = res;
              else if (res?.data && Array.isArray(res.data)) states = res.data;
              else if (res?.Data && Array.isArray(res.Data)) states = res.Data;
              else if (res?.message && Array.isArray(res.message)) states = res.message;

              this.states = states;

              if (u.stateId) {
                this.userService.getCities(u.stateId).subscribe({
                  next: (res) => {
                    let cities: any[] = [];

                    if (Array.isArray(res)) cities = res;
                    else if (res?.data && Array.isArray(res.data)) cities = res.data;
                    else if (res?.Data && Array.isArray(res.Data)) cities = res.Data;
                    else if (res?.message && Array.isArray(res.message)) cities = res.message;

                    this.cities = cities;
                  }
                });
              }
            }
          });
        }

        if (u.profileImageUrl) {
          this.previewUrl = u.profileImageUrl;
        }

        this.loading = false;
      },
      error: () => (this.loading = false)
    });
  }

  onFileChange(event: any) {
    const file: File = event.target.files[0];

    if (!file) {
      return;
    }

    console.log('=== FILE SELECTED ===');
    console.log('File name:', file.name);
    console.log('File size:', (file.size / 1024 / 1024).toFixed(2), 'MB');
    console.log('File type:', file.type);

    if (!this.validateImageSize(file)) {
      event.target.value = '';
      this.selectedFile = null;
      return;
    }

    this.selectedFile = file;

    const reader = new FileReader();
    reader.onload = () => (this.previewUrl = reader.result);
    reader.readAsDataURL(file);
  }

  getControl(name: string) {
    return this.form.get(name);
  }

  hasError(field: string, error: string): boolean {
    const control = this.form.get(field);
    return control ? control.hasError(error) && (control.dirty || control.touched) : false;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      
      // Collect all validation errors
      const errors: string[] = [];
      
      if (this.form.get('fullName')?.invalid) {
        if (this.form.get('fullName')?.hasError('required')) {
          errors.push('Full Name is required');
        } else if (this.form.get('fullName')?.hasError('minlength')) {
          errors.push('Full Name must be at least 2 characters');
        } else if (this.form.get('fullName')?.hasError('pattern')) {
          errors.push('Full Name can only contain letters and spaces');
        }
      }
      
      if (this.form.get('email')?.invalid) {
        if (this.form.get('email')?.hasError('required')) {
          errors.push('Email is required');
        } else if (this.form.get('email')?.hasError('pattern')) {
          errors.push('Please enter a valid email address');
        }
      }
      
      if (this.form.get('password')?.invalid && this.mode === 'add') {
        if (this.form.get('password')?.hasError('required')) {
          errors.push('Password is required');
        } else if (this.form.get('password')?.hasError('pattern')) {
          errors.push('Password must contain uppercase, number, and special character (8-50 chars)');
        }
      }
      
      if (this.form.get('phoneNumber')?.invalid) {
        if (this.form.get('phoneNumber')?.hasError('required')) {
          errors.push('Phone Number is required');
        } else if (this.form.get('phoneNumber')?.hasError('pattern')) {
          errors.push('Phone Number must be 10-15 digits');
        }
      }
      
      if (this.form.get('role')?.hasError('required')) {
        errors.push('Role is required');
      }
      
      if (this.form.get('dateOfBirth')?.invalid) {
        if (this.form.get('dateOfBirth')?.hasError('required')) {
          errors.push('Date of Birth is required');
        } else if (this.form.get('dateOfBirth')?.hasError('minAge')) {
          errors.push('User must be at least 18 years old');
        }
      }
      
      if (this.form.get('countryId')?.hasError('required')) {
        errors.push('Country is required');
      }
      
      if (this.form.get('stateId')?.hasError('required')) {
        errors.push('State is required');
      }
      
      if (this.form.get('cityId')?.hasError('required')) {
        errors.push('City is required');
      }
      
      const errorMessage = errors.length > 0 
        ? 'Please fix the following errors:\n\n• ' + errors.join('\n• ')
        : 'Please fill all required fields correctly';
      
      alert(errorMessage);
      return;
    }

    this.saving = true;
    this.successMessage = '';

    const value = this.form.value;
    const fd = new FormData();

    fd.append('FullName', value.fullName || '');
    fd.append('Email', value.email || '');
    fd.append('PhoneNumber', value.phoneNumber || '');
    fd.append('Role', value.role || '');
    fd.append('isActive', String(value.isActive));
    fd.append('DateOfBirth', value.dateOfBirth || '');
    fd.append('CountryId', value.countryId ? String(value.countryId) : '0');
    fd.append('StateId', value.stateId ? String(value.stateId) : '0');
    fd.append('CityId', value.cityId ? String(value.cityId) : '0');

    if (this.selectedFile) {
      fd.append('ProfileImage', this.selectedFile);
    }

    if (this.mode === 'add') {
      fd.append('Password', value.password || '');
      this.create(fd);
    } else {
      if (this.userId) {
        fd.append('Id', this.userId);
      }
      // Password is NOT required for update and not in the view model
      this.update(fd);
    }
  }

  create(fd: FormData) {
    console.log('=== CREATE USER REQUEST ===');
    console.log('FormData contents:');
    fd.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    this.userService.createUser(fd).subscribe({
      next: (response) => {
        console.log('=== CREATE USER SUCCESS ===');
        console.log('Response:', response);
        this.saving = false;
        this.successMessage = "User created successfully";
        
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 3000);
      },
      error: (err) => {
        console.error('=== CREATE USER ERROR ===');
        console.error('Full Error:', err);
        console.error('Status:', err.status);
        console.error('Error Body:', err.error);
        console.error('Error Message:', err.message);
        
        this.saving = false;
        
        let errorMessage = "Error creating user";
        
        if (err.status === 400) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.errors) {
            // Handle validation errors
            const errors = Object.values(err.error.errors).flat();
            errorMessage = errors.join(', ');
          }
        } else if (err.status === 401) {
          errorMessage = "Unauthorized. Please login again.";
        } else if (err.status === 403) {
          errorMessage = "You don't have permission to create users.";
        } else if (err.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
        
        console.log('Final Error Message:', errorMessage);
        alert(errorMessage);
      }
    });
  }

  update(fd: FormData) {
    console.log('=== UPDATE USER REQUEST ===');
    console.log('User ID:', this.userId);
    console.log('FormData contents:');
    fd.forEach((value, key) => {
      console.log(`${key}:`, value);
    });

    if (!this.userId) {
      alert('Error: User ID is missing');
      this.saving = false;
      return;
    }

    this.userService.updateUser(this.userId, fd).subscribe({
      next: (response) => {
        console.log('=== UPDATE USER SUCCESS ===');
        console.log('Response:', response);
        this.saving = false;
        this.successMessage = "User updated successfully";
        
        setTimeout(() => {
          this.router.navigate(['/users']);
        }, 3000);
      },
      error: (err) => {
        console.error('=== UPDATE USER ERROR ===');
        console.error('Full Error:', err);
        console.error('Status:', err.status);
        console.error('Error Body:', err.error);
        
        this.saving = false;
        
        let errorMessage = "Error updating user";
        
        if (err.status === 400) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error?.message) {
            errorMessage = err.error.message;
          } else if (err.error?.Message) {
            errorMessage = err.error.Message;
          } else if (err.error?.errors) {
            const errors = Object.values(err.error.errors).flat();
            errorMessage = errors.join(', ');
          }
        } else if (err.status === 401) {
          errorMessage = "Unauthorized. Please login again.";
        } else if (err.status === 403) {
          errorMessage = "You don't have permission to update users.";
        } else if (err.status === 500) {
          errorMessage = "Server error. Please try again later.";
        } else if (err.error) {
          if (typeof err.error === 'object' && err.error.message) {
            errorMessage = err.error.message;
          } else if (typeof err.error === 'string') {
            errorMessage = err.error;
          }
        }
        
        console.log('Final Error Message:', errorMessage);
        alert(errorMessage);
      }
    });
  }

  cancel() {
    this.router.navigate(['/users']);
  }

  
}
