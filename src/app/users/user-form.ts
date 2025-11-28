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

      password: [''],

      phoneNumber: ['', [Validators.pattern(/^\d{10,15}$/)]],

      role: ['', Validators.required],

      isActive: [true, Validators.required],

      dateOfBirth: ['', this.validateDateOfBirth],

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
        let rolesArray: any[] = [];

        if (Array.isArray(res)) rolesArray = res;
        else if (res?.data && Array.isArray(res.data)) rolesArray = res.data;
        else if (res?.Data && Array.isArray(res.Data)) rolesArray = res.Data;
        else if (res?.message && Array.isArray(res.message)) rolesArray = res.message;

        this.roles = rolesArray.map((r: any) => ({
          id: r.id,
          name: r.name || r.roleName || r.role
        }));
      },
      error: () => (this.roles = [])
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
        const u = res?.data?.[0] || res?.message?.data?.[0];

        if (!u) {
          alert("User not found");
          this.router.navigate(['/users']);
          return;
        }

        this.form.patchValue({
          fullName: u.fullName || '',
          email: u.email || '',
          phoneNumber: u.phoneNumber || '',
          role: Array.isArray(u.roles) ? u.roles[0] : u.roles || '',
          isActive: u.isActive !== false,
          dateOfBirth: u.dateOfBirth ? u.dateOfBirth.substring(0, 10) : '',
          countryId: u.countryId || null,
          stateId: u.stateId || null,
          cityId: u.cityId || null
        });

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
      alert("Please fill all required fields correctly");
      return;
    }

    this.saving = true;

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
    this.userService.createUser(fd).subscribe({
      next: () => {
        this.saving = false;
        alert("User created successfully");
        this.router.navigate(['/users']);
      },
      error: () => {
        this.saving = false;
        alert("Error creating user");
      }
    });
  }

  update(fd: FormData) {
    this.userService.updateUser(fd).subscribe({
      next: () => {
        this.saving = false;
        alert("User updated successfully");
        this.router.navigate(['/users']);
      },
      error: (err) => {
        this.saving = false;
        console.error("Update Error:", err);
        const msg = err?.error || err?.message || "Error updating user";
        alert(msg);
      }
    });
  }

  cancel() {
    this.router.navigate(['/users']);
  }

  
}
