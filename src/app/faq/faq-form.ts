import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CKEditorModule } from '@ckeditor/ckeditor5-angular';
// @ts-ignore
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { FaqService } from './faq.service';

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
    private route: ActivatedRoute
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
      question: ['', [Validators.required]],
      answer: ['', [Validators.required]],
      isActive: [true, [Validators.required]],
    });
  }

  loadFaq() {
    if (!this.faqId) return;

    this.loading = true;
    this.faqService.getFaqById(this.faqId).subscribe({
      next: (response) => {
        console.log('Load FAQ response:', response);
        
        if (response.success && response.data && response.data.data) {
          // Backend returns: { success, data: { data: [...], totalItems, page, pageSize } }
          // Find the FAQ with matching ID
          const faqData = response.data.data.find((f: any) => f.id === this.faqId);

          if (faqData) {
            this.form.patchValue({
              question: faqData.question,
              answer: faqData.answer,
              isActive: faqData.isActive,
            });
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
    return !!(control && control.invalid && control.touched);
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
        console.log('FAQ save response:', response);
        this.saving = false;
        
        // Handle different response formats
        let message = 'FAQ saved successfully';
        
        if (typeof response === 'string') {
          message = response;
        } else if (response && typeof response === 'object') {
          if (response.message) {
            message = response.message;
          } else if (response.success !== undefined) {
            message = response.success ? 'FAQ saved successfully' : 'Failed to save FAQ';
          }
        }
        
        alert(message);
        this.router.navigate(['/faq']);
      },
      error: (err) => {
        console.error('=== FAQ SAVE ERROR ===');
        console.error('Full error object:', err);
        console.error('Error status:', err.status);
        console.error('Error error:', err.error);
        
        this.saving = false;
        
        // Handle error message - check for nested error structure
        let errorMessage = 'Failed to save FAQ';
        let isSuccess = false;
        
        if (err.error) {
          // Check for nested structure: { error: {}, text: "message" }
          if (err.error.text) {
            errorMessage = err.error.text;
            // Check if it's actually a success message
            if (errorMessage.toLowerCase().includes('success') || 
                errorMessage.toLowerCase().includes('created') ||
                errorMessage.toLowerCase().includes('updated')) {
              isSuccess = true;
            }
          }
          // Check for nested error object with h_text
          else if (err.error.error && err.error.error.h_text) {
            errorMessage = err.error.error.h_text;
            if (errorMessage.toLowerCase().includes('success') || 
                errorMessage.toLowerCase().includes('created') ||
                errorMessage.toLowerCase().includes('updated')) {
              isSuccess = true;
            }
          }
          // Check for h_text directly
          else if (err.error.h_text) {
            errorMessage = err.error.h_text;
            if (errorMessage.toLowerCase().includes('success') || 
                errorMessage.toLowerCase().includes('created') ||
                errorMessage.toLowerCase().includes('updated')) {
              isSuccess = true;
            }
          }
          // Check for standard message
          else if (err.error.message) {
            errorMessage = err.error.message;
          }
          // If it's a string
          else if (typeof err.error === 'string') {
            errorMessage = err.error;
          }
        } else if (err.message) {
          errorMessage = err.message;
        }
        
        console.log('Final error message:', errorMessage);
        console.log('Is success:', isSuccess);
        
        // If it's a success message, just navigate without alert
        if (isSuccess) {
          console.log('FAQ saved successfully (from error handler)');
          this.router.navigate(['/faq']);
        } else {
          alert(errorMessage);
        }
      },
    });
  }

  cancel() {
    this.router.navigate(['/faq']);
  }
}
