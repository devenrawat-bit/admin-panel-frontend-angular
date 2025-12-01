// src/app/cms/cms-form.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CmsService, CmsDto } from './cms.service';

import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
// @ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

@Component({
  selector: 'app-cms-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule],
  templateUrl: './cms-form.html',
  styleUrls: ['./cms-form.scss'],
})
export class CmsForm implements OnInit {
  // CKEditor instance
  public Editor: any = ClassicEditor;
  public editorConfig = {
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'link',
        'bulletedList',
        'numberedList',
        '|',
        'blockQuote',
        'insertTable',
        '|',
        'undo',
        'redo'
      ]
    }
  };

  form!: FormGroup;
  mode: 'add' | 'edit' = 'add';
  cmsId: number | null = null;

  loading = false;
  saving = false;
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private cmsService: CmsService
  ) {}

  ngOnInit() {
    // reactive form - matching backend CreateCmsViewModel
    this.form = this.fb.group({
      key: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z0-9_-]+$/)
      ]],
      title: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(100)
      ]],
      metaKeyword: ['', [
        Validators.required,
        Validators.maxLength(200)
      ]],
      isActive: [true, [Validators.required]],
      content: ['', [Validators.required]],
    });

    // route param se ID nikaal
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.cmsId = Number(idParam);
      this.mode = 'edit';
      this.loadCms(this.cmsId);
    } else {
      this.mode = 'add';
    }
  }

  // existing CMS load for edit
  loadCms(id: number) {
    this.loading = true;
    this.cmsService.getCmsById(id).subscribe({
      next: (res) => {
        const data = res?.data as CmsDto | undefined;
        if (!data) {
          alert('CMS not found');
          this.router.navigate(['/cms']);
          return;
        }

        // First set all fields except content
        this.form.patchValue({
          key: data.key,
          title: data.title,
          metaKeyword: data.metaKeyword,
          isActive: data.isActive,
        });

        // Set content after a short delay to ensure CKEditor is ready
        setTimeout(() => {
          this.form.patchValue({
            content: data.content ?? '',
          });
        }, 100);

        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading CMS by id', err);
        this.loading = false;
        alert(
          'Error loading CMS: ' +
            (err.error?.message || err.message || 'Unknown error')
        );
      },
    });
  }

  // CKEditor ready event
  onEditorReady(editor: any) {
    console.log('CKEditor is ready', editor);
  }

  submit() {
    // Check if content is empty manually since CKEditor might not trigger validation immediately
    const contentControl = this.form.get('content');
    if (!contentControl?.value) {
      contentControl?.setErrors({ required: true });
      contentControl?.markAsTouched();
    }

    // Mark all fields as touched to show validation errors
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      console.log("Form invalid, errors:", this.form.errors);
      return;
    }

    const value = this.form.value;

    const body = {
      key: (value.key || '').trim(),
      title: (value.title || '').trim(),
      metaKeyword: (value.metaKeyword || '').trim(),
      isActive: value.isActive,
      content: value.content, // CKEditor HTML
    };

    console.log('Submitting CMS with content:', body.content);
    console.log('Full body:', body);

    this.saving = true;
    this.successMessage = '';

    if (this.mode === 'add') {
      // create
      this.cmsService.addCms(body).subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = 'CMS created successfully';
          
          // Set flag in localStorage to reset sorting
          localStorage.setItem('cms_reset_sort', 'true');
          
          // Navigate without reload after 3 seconds
          setTimeout(() => {
            this.router.navigate(['/cms']);
          }, 3000);
        },
        error: (err) => {
          console.error('Error adding CMS', err);
          console.error('Error details:', err.error);
          this.saving = false;
          
          // Show detailed validation errors
          let errorMessage = 'Error adding CMS:\n';
          
          if (err.error?.errors) {
            // ASP.NET validation errors
            Object.keys(err.error.errors).forEach(key => {
              const messages = err.error.errors[key];
              errorMessage += `\n${key}: ${Array.isArray(messages) ? messages.join(', ') : messages}`;
            });
          } else if (err.error?.message) {
            errorMessage += err.error.message;
          } else if (err.error?.title) {
            errorMessage += err.error.title;
          } else {
            errorMessage += err.message || 'Unknown error';
          }
          
          alert(errorMessage);
        },
      });
    } else if (this.mode === 'edit' && this.cmsId !== null) {
      // update
      this.cmsService.updateCms(this.cmsId, body).subscribe({
        next: () => {
          this.saving = false;
          this.successMessage = 'CMS updated successfully';
          
          setTimeout(() => {
            this.router.navigate(['/cms']);
          }, 3000);
        },
        error: (err) => {
          console.error('Error updating CMS', err);
          this.saving = false;
          alert(
            'Error updating CMS: ' +
              (err.error?.message || err.message || 'Unknown error')
          );
        },
      });
    }
  }

  cancel() {
    this.router.navigate(['/cms']);
  }

  // Dynamic validation methods (trigger on input)
  onKeyInput() {
    const keyControl = this.form.get('key');
    if (keyControl) {
      keyControl.markAsTouched();
    }
  }

  onTitleInput() {
    const titleControl = this.form.get('title');
    if (titleControl) {
      titleControl.markAsTouched();
    }
  }

  // Blur validation methods
  onKeyBlur() {
    const keyControl = this.form.get('key');
    if (keyControl) {
      keyControl.markAsTouched();
    }
  }

  onTitleBlur() {
    const titleControl = this.form.get('title');
    if (titleControl) {
      titleControl.markAsTouched();
    }
  }

  onMetaKeywordBlur() {
    const metaKeywordControl = this.form.get('metaKeyword');
    if (metaKeywordControl) {
      metaKeywordControl.markAsTouched();
    }
  }

  onContentBlur() {
    const contentControl = this.form.get('content');
    if (contentControl) {
      contentControl.markAsTouched();
    }
  }

  // Real-time validation helpers
  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';
    if (!control.dirty && !control.touched) return '';

    if (field === 'title') {
      if (control.errors['required']) return 'Title is required';
      if (control.errors['minlength']) return 'Title must be at least 3 characters';
      if (control.errors['maxlength']) return 'Title cannot exceed 100 characters';
    }

    if (field === 'key') {
      if (control.errors['required']) return 'Key is required';
      if (control.errors['minlength']) return 'Key must be at least 2 characters';
      if (control.errors['maxlength']) return 'Key cannot exceed 50 characters';
      if (control.errors['pattern']) return 'Key can only contain letters, numbers, underscores, and hyphens';
    }

    if (field === 'metaKeyword') {
      if (control.errors['required']) return 'Meta Keyword is required';
      if (control.errors['maxlength']) return 'Meta Keyword cannot exceed 200 characters';
    }

    if (field === 'content') {
      if (control.errors['required']) return 'Content is required';
    }

    return '';
  }

  getCharacterCount(field: string): string {
    const control = this.form.get(field);
    const value = control?.value || '';
    const length = value.length;

    if (field === 'title') {
      return `${length}/100`;
    }
    if (field === 'key') {
      return `${length}/50`;
    }
    if (field === 'metaKeyword') {
      return `${length}/200`;
    }

    return '';
  }
}
