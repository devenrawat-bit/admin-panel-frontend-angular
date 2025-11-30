// src/app/cms/cms-form.ts
import { Component } from '@angular/core';
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
export class CmsForm {
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
  editorReady = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private cmsService: CmsService
  ) {}

  ngOnInit() {
    // reactive form
    this.form = this.fb.group({
      key: ['', [Validators.required, Validators.maxLength(100)]],
      title: ['', [Validators.required, Validators.maxLength(150)]],
      metaKeyword: ['', [Validators.required, Validators.maxLength(200)]],
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

  get f() {
    return this.form.controls;
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
    this.editorReady = true;
    console.log('CKEditor is ready', editor);
  }

  submit() {
    // Mark all fields as touched to show validation errors
    this.form.markAllAsTouched();
    
    // Get current CKEditor content
    const contentControl = this.form.get('content');
    if (contentControl && !contentControl.value) {
      // Content is empty, mark as invalid
      contentControl.setErrors({ 'required': true });
    }

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

    if (this.mode === 'add') {
      // create
      this.cmsService.addCms(body).subscribe({
        next: () => {
          this.saving = false;
          alert('CMS created successfully');
          this.router.navigate(['/cms']);
        },
        error: (err) => {
          console.error('Error adding CMS', err);
          this.saving = false;
          alert(
            'Error adding CMS: ' +
              (err.error?.message || err.message || 'Unknown error')
          );
        },
      });
    } else if (this.mode === 'edit' && this.cmsId !== null) {
      // update
      this.cmsService.updateCms(this.cmsId, body).subscribe({
        next: () => {
          this.saving = false;
          alert('CMS updated successfully');
          this.router.navigate(['/cms']);
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
}
