import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
// @ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { FaqService } from './faq.service';
import { ToastService } from '../shared/toast/toast.service';

// Custom validator for HTML content
function htmlContentValidator(minLength: number, maxLength: number) {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) {
      return null; // Let required validator handle empty values
    }

    // Strip HTML tags to get plain text
    const div = document.createElement('div');
    div.innerHTML = control.value;
    const textContent = div.textContent || div.innerText || '';
    const trimmedText = textContent.trim();
    const length = trimmedText.length;

    if (length < minLength) {
      return { minlength: { requiredLength: minLength, actualLength: length } };
    }

    if (length > maxLength) {
      return { maxlength: { requiredLength: maxLength, actualLength: length } };
    }

    return null;
  };
}

@Component({
  selector: 'app-faq-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CKEditorModule, RouterLink],
  templateUrl: './faq-form.html',
  styleUrl: './faq-form.scss',
})
export class FaqForm implements OnInit {
  form!: FormGroup;
  mode: 'add' | 'edit' = 'add';
  faqId: number | null = null;
  loading = false;
  saving = false;
  successMessage = '';

  // CKEditor
  public Editor = ClassicEditor;
  public editorConfig = {
    toolbar: [
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
      'redo',
    ],
  };

  constructor(
    private fb: FormBuilder,
    private faqService: FaqService,
    private router: Router,
    private route: ActivatedRoute,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.initForm();

    // Check if we're in edit mode
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.faqId = parseInt(idParam, 10);
      this.mode = 'edit';
      this.loadFaq();
    }
  }

  initForm() {
    this.form = this.fb.group({
      question: ['', [
        Validators.required,
        Validators.minLength(5),
        Validators.maxLength(200)
      ]],
      answer: ['', [
        Validators.required,
        htmlContentValidator(10, 1000)
      ]],
      isActive: [true, [Validators.required]],
    });
  }

  loadFaq() {
    if (!this.faqId) return;

    this.loading = true;
    this.faqService.getFaqById(this.faqId).subscribe({
      next: (response) => {
        console.log('Load FAQ response:', response);
        
        if (response.success && response.data) {
          // Backend returns: { success, data: { ... } }
          // Check if data is directly the FAQ object or nested
          let faqData = response.data;
          
          // If response.data has a data property that is an array (pagination structure)
          if (response.data.data && Array.isArray(response.data.data)) {
             faqData = response.data.data.find((f: any) => f.id === this.faqId);
          }

          if (faqData) {
            this.form.patchValue({
              question: faqData.question,
              isActive: faqData.isActive,
            });
            
            // Use setTimeout to ensure CKEditor is ready
            setTimeout(() => {
              this.form.patchValue({
                answer: faqData.answer
              });
            }, 100);
          } else {
            alert('FAQ not found');
            this.router.navigate(['/faq']);
          }
        } else {
          alert('FAQ not found');
          this.router.navigate(['/faq']);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading FAQ:', err);
        alert('Failed to load FAQ');
        this.loading = false;
        this.router.navigate(['/faq']);
      },
    });
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    // Show error if field is invalid and has been interacted with (dirty or touched)
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  getErrorMessage(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';
    
    // Show errors in real-time if field has been interacted with
    if (!control.dirty && !control.touched) return '';

    if (field === 'question') {
      if (control.errors['required']) return 'Question is required';
      if (control.errors['minlength']) return 'Question must be at least 5 characters';
      if (control.errors['maxlength']) return 'Question cannot exceed 200 characters';
    }

    if (field === 'answer') {
      if (control.errors['required']) return 'Answer is required';
      if (control.errors['minlength']) return 'Answer must be at least 10 characters';
      if (control.errors['maxlength']) return 'Answer cannot exceed 1000 characters';
    }

    return '';
  }

  getCharacterCount(field: string): string {
    const control = this.form.get(field);
    const value = control?.value || '';
    
    if (field === 'question') {
      const length = value.length;
      return `${length}/200`;
    }
    
    if (field === 'answer') {
      // For answer field, count actual text content without HTML tags
      const div = document.createElement('div');
      div.innerHTML = value;
      const textContent = div.textContent || div.innerText || '';
      const length = textContent.trim().length;
      return `${length}/1000`;
    }
    
    return '';
  }

  onEditorReady(editor: any) {
    console.log('CKEditor is ready', editor);
  }

  submit() {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach((key) => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;
    this.successMessage = '';
    const formValue = this.form.value;
    
    // Prepare data for backend - only send fields that backend expects
    const faqData = {
      question: formValue.question,
      answer: formValue.answer,
      isActive: formValue.isActive,
    };

    console.log('Submitting FAQ data:', faqData);
    console.log('Mode:', this.mode);
    console.log('FAQ ID:', this.faqId);

    const request =
      this.mode === 'add'
        ? this.faqService.createFaq(faqData)
        : this.faqService.updateFaq(this.faqId!, faqData);

    request.subscribe({
      next: (response) => {
        console.log('✅ FAQ save response:', response);
        this.saving = false;
        this.toastService.show('FAQ saved successfully', 'success');
        
        setTimeout(() => {
          this.router.navigate(['/faq']);
        }, 2000);
      },
      error: (err) => {
        console.error('❌ FAQ SAVE ERROR:', err);
        this.saving = false;
        
        // Handle validation errors from backend
        let errorMessage = 'Failed to save FAQ';
        
        if (err.error?.errors) {
          // ASP.NET validation errors
          const errors = Object.values(err.error.errors).flat();
          errorMessage = errors.join(', ');
        } else if (err.error?.message) {
          errorMessage = err.error.message;
        } else if (typeof err.error === 'string') {
          errorMessage = err.error;
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        alert(errorMessage);
      },
    });
  }

  cancel() {
    this.router.navigate(['/faq']);
  }
}
