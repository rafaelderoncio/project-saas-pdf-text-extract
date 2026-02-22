import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.css'
})
export class PaginationComponent {
  @Input() public shown = 0;
  @Input() public total = 0;
  @Input() public page = 1;
  @Input() public totalPages = 1;
  @Input() public pageSize = 10;
  @Input() public pageSizes: number[] = [5, 10, 20];

  @Output() public pageChange = new EventEmitter<number>();
  @Output() public pageSizeChange = new EventEmitter<number>();

  protected pageNumbers(): number[] {
    return Array.from({ length: Math.max(1, this.totalPages) }, (_, index) => index + 1);
  }

  protected previousPage(): void {
    if (this.page <= 1) {
      return;
    }

    this.pageChange.emit(this.page - 1);
  }

  protected nextPage(): void {
    if (this.page >= this.totalPages) {
      return;
    }

    this.pageChange.emit(this.page + 1);
  }

  protected goToPage(pageNumber: number): void {
    if (pageNumber < 1 || pageNumber > this.totalPages || pageNumber === this.page) {
      return;
    }

    this.pageChange.emit(pageNumber);
  }

  protected onPageSizeSelect(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (Number.isNaN(value)) {
      return;
    }

    this.pageSizeChange.emit(value);
  }
}
