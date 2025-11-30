import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CmsService, CmsDto } from './cms.service';

@Component({
  selector: 'app-cms',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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

  loading = false;

  constructor(
    private cmsService: CmsService,
    private router: Router
  ) {}

  ngOnInit() {
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

  deleteCms(item: CmsDto) {
    if (!confirm(`Delete CMS "${item.title}" ?`)) return;

    this.cmsService.deleteCms(item.id).subscribe({
      next: () => {
        this.loadCms();
      },
      error: (err) => {
        console.error('Error deleting CMS', err);
        alert('Error deleting CMS');
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
