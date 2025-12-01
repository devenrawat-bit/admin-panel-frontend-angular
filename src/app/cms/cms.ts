import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CmsService, CmsDto } from './cms.service';
import { ModalService } from '../shared/modal/modal.service';
import { ToastService } from '../shared/toast/toast.service';

@Component({
  selector: 'app-cms',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cms.html',
  styleUrls: ['./cms.scss'],
})
export class CmsList {
  cmsItems: CmsDto[] = [];

  // filters
  searchTitle = '';
  searchKey = '';
  searchMetaKeyword = '';
  searchIsActive: string = '';

  // pagination
  page = 1;
  pageSize = 10;
  totalItems = 0;

  // sorting - default to CreatedOn descending (newest first)
  sortColumn = 'CreatedOn';
  sortDirection: 'asc' | 'desc' = 'desc';

  loading = false;

  constructor(
    private cmsService: CmsService,
    private router: Router,
    private route: ActivatedRoute,
    private modalService: ModalService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    // Check if we need to reset to default sorting (e.g., after adding new CMS)
    const resetSort = localStorage.getItem('cms_reset_sort');
    if (resetSort === 'true') {
      // Reset to default sorting
      this.sortColumn = 'CreatedOn';
      this.sortDirection = 'desc';
      this.page = 1;
      // Clear the flag
      localStorage.removeItem('cms_reset_sort');
    }
    
    this.loadCms();
  }

  loadCms() {
    this.loading = true;

    const filters: Record<string, string> = {};
    
    if (this.searchTitle.trim()) {
      filters['title'] = this.searchTitle.trim();
    }
    if (this.searchKey.trim()) {
      filters['key'] = this.searchKey.trim();
    }
    if (this.searchMetaKeyword.trim()) {
      filters['metakeyword'] = this.searchMetaKeyword.trim();
    }
    if (this.searchIsActive) {
      filters['isactive'] = this.searchIsActive;
    }

    const payload = {
      page: this.page,
      pageSize: this.pageSize,
      search: '',
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
      filters: filters
    };

    console.log('CMS Request Payload:', payload);

    this.cmsService.getCmsList(payload).subscribe({
      next: (res) => {
        const list = res?.data?.data ?? [];
        this.cmsItems = list;
        this.totalItems = res?.data?.totalItems ?? list.length ?? 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading CMS list', err);
        this.cmsItems = [];
        this.totalItems = 0;
        this.loading = false;
        alert('Error loading CMS list');
      },
    });
  }

  onFilterChange() {
    this.page = 1;
    this.loadCms();
  }

  clearFilters() {
    this.searchTitle = '';
    this.searchKey = '';
    this.searchMetaKeyword = '';
    this.searchIsActive = '';
    this.page = 1;
    this.loadCms();
  }

  // Sorting methods
  sortBy(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.loadCms();
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '⇅';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  // pagination helpers
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
    this.loadCms();
  }

  nextPage() {
    if (this.page * this.pageSize < this.totalItems) {
      this.page++;
      this.loadCms();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadCms();
    }
  }

  goToAdd() {
    this.router.navigate(['/cms/add']);
  }

  goToEdit(item: CmsDto) {
    this.router.navigate(['/cms/edit', item.id]);
  }

  async deleteCms(item: CmsDto) {
    const confirmed = await this.modalService.confirm(
      'Delete CMS',
      `Are you sure you want to delete "${item.title}"?`
    );

    if (!confirmed) return;

    this.cmsService.deleteCms(item.id).subscribe({
      next: () => {
        this.modalService.success('Success', 'CMS deleted successfully');
        this.loadCms();
      },
      error: (err) => {
        console.error('Error deleting CMS', err);
        this.modalService.success('Error', 'Failed to delete CMS'); // Using success modal for error for now as requested "interactive popup"
      },
    });
  }

  toggleActive(item: CmsDto) {
    const newValue = !item.isActive;

    // First fetch the full CMS data to ensure we have all required fields
    this.cmsService.getCmsById(item.id).subscribe({
      next: (res) => {
        const fullData = res?.data;
        if (!fullData) {
          this.toastService.error('CMS data not found');
          return;
        }

        // Now update with complete data
        const body = {
          key: fullData.key,
          title: fullData.title,
          metaKeyword: fullData.metaKeyword,
          content: fullData.content,
          isActive: newValue,
        };

        this.cmsService.updateCms(item.id, body).subscribe({
          next: () => {
            item.isActive = newValue;
            this.toastService.success(`CMS ${newValue ? 'activated' : 'deactivated'} successfully`);
          },
          error: (err) => {
            console.error('Error toggling cms active', err);
            const errorMsg = err.error?.message || err.error?.title || 'Error updating status';
            this.toastService.error(errorMsg);
          },
        });
      },
      error: (err) => {
        console.error('Error fetching CMS data', err);
        this.toastService.error('Error loading CMS data');
      },
    });
  }
}
