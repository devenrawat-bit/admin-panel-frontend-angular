import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FaqService, Faq as FaqModel } from './faq.service';

@Component({
  selector: 'app-faq',
  imports: [CommonModule, FormsModule],
  templateUrl: './faq.html',
  styleUrl: './faq.scss',
})
export class Faq implements OnInit {
  faqs: FaqModel[] = [];
  loading = false;

  // Pagination
  page = 1;
  pageSize = 10;
  totalItems = 0;

  // Filters
  searchQuestion = '';
  searchIsActive = '';

  // Sorting - default to CreatedAt descending (newest first)
  sortField = 'CreatedAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(private faqService: FaqService, private router: Router) {}

  ngOnInit() {
    this.loadFaqs();
  }

  loadFaqs() {
    this.loading = true;

    this.faqService
      .getFaqs(
        this.page,
        this.pageSize,
        this.searchQuestion,
        this.searchIsActive,
        this.sortField,
        this.sortOrder
      )
      .subscribe({
        next: (response) => {
          console.log('=== FAQ LIST RESPONSE ===');
          console.log('Full response:', response);
          console.log('Response.success:', response?.success);
          console.log('Response.data:', response?.data);
          console.log('Response.data.data:', response?.data?.data);
          
          if (response && response.success && response.data) {
            // Backend returns: { success, message, data: { data: [...], totalItems, page, pageSize } }
            this.faqs = response.data.data || [];
            this.totalItems = response.data.totalItems || 0;
            
            console.log('FAQs loaded:', this.faqs);
            console.log('Total items:', this.totalItems);
          } else {
            console.warn('Response success is false or undefined');
            this.faqs = [];
            this.totalItems = 0;
          }
          
          this.loading = false;
        },
        error: (err) => {
          console.error('=== ERROR LOADING FAQs ===');
          console.error('Full error:', err);
          console.error('Error status:', err.status);
          console.error('Error message:', err.message);
          console.error('Error body:', err.error);
          
          this.faqs = [];
          this.totalItems = 0;
          this.loading = false;
        },
      });
  }

  onFilterChange() {
    this.page = 1;
    this.loadFaqs();
  }

  clearFilters() {
    this.searchQuestion = '';
    this.searchIsActive = '';
    this.page = 1;
    this.loadFaqs();
  }

  sortBy(field: string) {
    if (this.sortField === field) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortOrder = 'asc';
    }
    this.loadFaqs();
  }

  getSortIcon(field: string): string {
    if (this.sortField !== field) return '⇅';
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  toggleActive(faq: FaqModel) {
    const newStatus = !faq.isActive;

    // Update the FAQ with new status
    const updateData = {
      question: faq.question,
      answer: faq.answer,
      isActive: newStatus,
    };

    this.faqService.updateFaq(faq.id, updateData).subscribe({
      next: (response) => {
        console.log('Toggle response:', response);
        
        // Update the local state
        faq.isActive = newStatus;
        
        // Show success message if it's a string response
        if (typeof response === 'string') {
          // Don't show alert for toggle, just update silently
          console.log('FAQ status updated:', response);
        }
      },
      error: (err) => {
        console.error('Error toggling FAQ status:', err);
        
        let errorMessage = 'Failed to update FAQ status';
        if (err.error) {
          if (typeof err.error === 'string') {
            errorMessage = err.error;
          } else if (err.error.message) {
            errorMessage = err.error.message;
          }
        }
        
        alert(errorMessage);
      },
    });
  }

  deleteFaq(faq: FaqModel) {
    if (!confirm(`Are you sure you want to delete this FAQ: "${faq.question}"?`)) {
      return;
    }

    console.log('=== DELETING FAQ ===');
    console.log('FAQ object:', faq);
    console.log('FAQ ID:', faq.id);
    console.log('FAQ ID type:', typeof faq.id);

    this.faqService.deleteFaq(faq.id).subscribe({
      next: (response) => {
        console.log('=== DELETE FAQ SUCCESS ===');
        console.log('Full response:', response);
        console.log('Response type:', typeof response);
        
        // Backend returns: { success: true/false, message: "..." }
        if (response && typeof response === 'object') {
          if (response.success === true) {
            // Success - just reload without alert
            console.log('FAQ deleted successfully:', response.message);
            this.loadFaqs();
          } else {
            // Backend returned success: false
            alert(response.message || 'Failed to delete FAQ');
          }
        } else if (typeof response === 'string') {
          // String response
          console.log('FAQ deleted:', response);
          this.loadFaqs();
        } else {
          // Unknown format - just reload
          this.loadFaqs();
        }
      },
      error: (err) => {
        console.error('=== DELETE FAQ ERROR ===');
        console.error('Full error:', err);
        console.error('Error status:', err.status);
        console.error('Error error:', err.error);
        
        // Only show error if it's a real error (not a success message)
        if (err.error && typeof err.error === 'object') {
          if (err.error.success === true) {
            // Backend returned success but as HTTP error status
            console.log('FAQ deleted (success in error):', err.error.message);
            this.loadFaqs();
          } else if (err.error.message) {
            // Real error with message
            alert(err.error.message);
          } else {
            alert('Failed to delete FAQ');
          }
        } else if (typeof err.error === 'string') {
          // Check if string indicates success
          if (err.error.toLowerCase().includes('success') || 
              err.error.toLowerCase().includes('deleted')) {
            console.log('FAQ deleted (string success in error)');
            this.loadFaqs();
          } else {
            alert(err.error);
          }
        } else {
          alert('Failed to delete FAQ');
        }
      },
    });
  }

  goToAdd() {
    this.router.navigate(['/faq/add']);
  }

  goToEdit(faq: FaqModel) {
    this.router.navigate(['/faq/edit', faq.id]);
  }

  // Pagination
  get startIndex(): number {
    return (this.page - 1) * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min(this.page * this.pageSize, this.totalItems);
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadFaqs();
    }
  }

  nextPage() {
    if (this.page * this.pageSize < this.totalItems) {
      this.page++;
      this.loadFaqs();
    }
  }

  changePageSize(newSize: number) {
    this.pageSize = newSize;
    this.page = 1;
    this.loadFaqs();
  }
}
