import { Component } from '@angular/core';
import { ImportModalComponent } from '../../modal/import-modal.component';
import { PaginationComponent } from '../../comonents/pagination/pagination.component';
import { TableComponent } from '../../comonents/table/table.component';
import { ItensPaginados, Ordenacao, ScanFlowService } from '../../services/scan-flow.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ImportModalComponent, PaginationComponent, TableComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  protected isImportModalOpen = false;
  protected page = 1;
  protected pageSize = 10;
  protected readonly pageSizes = [5, 10, 25];
  protected nomeFiltro = '';
  protected statusFiltro: '' | 'Concluido' | 'Processando' | 'Erro' = '';
  protected ordenacao: Ordenacao = 'envio_desc';
  protected itemsPaged: ItensPaginados = {
    totalItems: 0,
    totalPages: 1,
    items: []
  };

  public constructor(private readonly scanFlowService: ScanFlowService) {
    this.recalculatePagination();
  }

  protected openImportModal(): void {
    this.isImportModalOpen = true;
  }

  protected closeImportModal(): void {
    this.isImportModalOpen = false;
  }

  protected onPdfSelected(file: File): void {
    this.scanFlowService.sendFile(file);
    this.page = 1;
    this.recalculatePagination();
  }

  protected onPageChange(nextPage: number): void {
    this.page = nextPage;
    this.recalculatePagination();
  }

  protected onPageSizeChange(nextPageSize: number): void {
    this.pageSize = nextPageSize;
    this.page = 1;
    this.recalculatePagination();
  }

  protected onNomeFiltroChange(event: Event): void {
    this.nomeFiltro = (event.target as HTMLInputElement).value;
    this.page = 1;
    this.recalculatePagination();
  }

  protected onStatusFiltroChange(event: Event): void {
    this.statusFiltro = (event.target as HTMLSelectElement).value as '' | 'Concluido' | 'Processando' | 'Erro';
    this.page = 1;
    this.recalculatePagination();
  }

  protected onOrdenacaoChange(event: Event): void {
    this.ordenacao = (event.target as HTMLSelectElement).value as Ordenacao;
    this.page = 1;
    this.recalculatePagination();
  }

  private recalculatePagination(): void {
    const paged = this.scanFlowService.getItems(this.page, this.pageSize, {
      nome: this.nomeFiltro,
      status: this.statusFiltro,
      ordenacao: this.ordenacao
    });
    this.itemsPaged = paged;
    if (this.page > paged.totalPages) {
      this.page = paged.totalPages;
      this.itemsPaged = this.scanFlowService.getItems(this.page, this.pageSize, {
        nome: this.nomeFiltro,
        status: this.statusFiltro,
        ordenacao: this.ordenacao
      });
    }
  }
}
