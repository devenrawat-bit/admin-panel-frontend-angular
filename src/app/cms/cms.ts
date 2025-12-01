import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CmsService, CmsDto } from './cms.service';
import { ModalService } from '../shared/modal/modal.service';

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
    private modalService: ModalService
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

    const payload = {
      page: this.page,
      pageSize: this.pageSize,
      searchTitle: this.searchTitle.trim(),
      searchKey: this.searchKey.trim(),
      searchMetaKeyword: this.searchMetaKeyword.trim(),
      searchIsActive: this.searchIsActive, // '', 'true', 'false'
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection,
    };

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

    const body = {
      key: item.key,
      title: item.title,
      metaKeyword: item.metaKeyword,
      content: item.content,
      isActive: newValue,
    };

    this.cmsService.updateCms(item.id, body).subscribe({
      next: () => {
        item.isActive = newValue;
      },
      error: (err) => {
        console.error('Error toggling cms active', err);
        alert('Error updating status');
      },
    });
  }
}
