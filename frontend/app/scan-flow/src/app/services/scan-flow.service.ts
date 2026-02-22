import { Injectable } from '@angular/core';

export interface TableItem {
  arquivo: string;
  tamanho: string;
  tipo: string;
  envio: string;
  processamento: string;
  status: 'Concluido' | 'Processando' | 'Erro';
  acao: string;
}

export interface ItensPaginados {
  totalItems: number;
  totalPages: number;
  items: TableItem[];
}

export type Ordenacao =
  | 'envio_desc'
  | 'envio_asc'
  | 'processamento_desc'
  | 'processamento_asc';

export interface FiltroItens {
  nome?: string;
  status?: '' | 'Concluido' | 'Processando' | 'Erro';
  ordenacao?: Ordenacao;
}

@Injectable({ providedIn: 'root' })
export class ScanFlowService {
  private readonly allItems: TableItem[] = [
    { arquivo: 'contrato-cliente.pdf', tamanho: '1.3 MB', tipo: 'PDF', envio: '20/02/2026 08:14', processamento: '20/02/2026 08:15', status: 'Concluido', acao: 'Resultado' },
    { arquivo: 'nota-fiscal-janeiro.pdf', tamanho: '842 KB', tipo: 'PDF', envio: '20/02/2026 08:16', processamento: '20/02/2026 08:16', status: 'Processando', acao: 'Aguardar' },
    { arquivo: 'recibo-fornecedor.pdf', tamanho: '532 KB', tipo: 'PDF', envio: '20/02/2026 08:17', processamento: '20/02/2026 08:18', status: 'Erro', acao: 'Retentar' },
    { arquivo: 'declaracao-anual.pdf', tamanho: '2.1 MB', tipo: 'PDF', envio: '20/02/2026 08:20', processamento: '20/02/2026 08:21', status: 'Concluido', acao: 'Resultado' },
    { arquivo: 'orcamento-projeto.pdf', tamanho: '690 KB', tipo: 'PDF', envio: '20/02/2026 08:23', processamento: '20/02/2026 08:24', status: 'Concluido', acao: 'Resultado' },
    { arquivo: 'ata-reuniao.pdf', tamanho: '480 KB', tipo: 'PDF', envio: '20/02/2026 08:25', processamento: '20/02/2026 08:26', status: 'Processando', acao: 'Aguardar' },
    { arquivo: 'comprovante-pagamento.pdf', tamanho: '390 KB', tipo: 'PDF', envio: '20/02/2026 08:27', processamento: '20/02/2026 08:28', status: 'Concluido', acao: 'Resultado' },
    { arquivo: 'fatura-servicos.pdf', tamanho: '920 KB', tipo: 'PDF', envio: '20/02/2026 08:30', processamento: '20/02/2026 08:31', status: 'Erro', acao: 'Retentar' },
    { arquivo: 'proposta-comercial.pdf', tamanho: '1.0 MB', tipo: 'PDF', envio: '20/02/2026 08:33', processamento: '20/02/2026 08:34', status: 'Concluido', acao: 'Resultado' },
    { arquivo: 'inventario-documentos.pdf', tamanho: '740 KB', tipo: 'PDF', envio: '20/02/2026 08:36', processamento: '20/02/2026 08:37', status: 'Processando', acao: 'Aguardar' },
    { arquivo: 'laudo-tecnico.pdf', tamanho: '1.8 MB', tipo: 'PDF', envio: '20/02/2026 08:39', processamento: '20/02/2026 08:40', status: 'Concluido', acao: 'Resultado' },
    { arquivo: 'relatorio-financeiro.pdf', tamanho: '1.4 MB', tipo: 'PDF', envio: '20/02/2026 08:41', processamento: '20/02/2026 08:42', status: 'Concluido', acao: 'Resultado' },
    { arquivo: 'protocolo-interno.pdf', tamanho: '610 KB', tipo: 'PDF', envio: '20/02/2026 08:44', processamento: '20/02/2026 08:45', status: 'Erro', acao: 'Retentar' }
  ];

  public getItems(page: number, pageSize: number, filtro: FiltroItens = {}): ItensPaginados {
    const safePageSize = pageSize > 0 ? pageSize : 10;
    const nomeFiltro = (filtro.nome ?? '').trim().toLowerCase();
    const statusFiltro = filtro.status ?? '';
    const ordenacao = filtro.ordenacao ?? 'envio_desc';

    const filteredItems = this.allItems
      .filter((item) => {
        const matchNome = !nomeFiltro || item.arquivo.toLowerCase().includes(nomeFiltro);
        const matchStatus = !statusFiltro || item.status === statusFiltro;
        return matchNome && matchStatus;
      })
      .sort((a, b) => this.compareBySort(a, b, ordenacao));

    const totalItems = filteredItems.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize));
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const start = (safePage - 1) * safePageSize;

    return {
      totalItems,
      totalPages,
      items: filteredItems.slice(start, start + safePageSize)
    };
  }

  public sendFile(file: File): void {
    const now = new Date();
    const pad = (value: number) => String(value).padStart(2, '0');
    const stamp = `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

    this.allItems.unshift({
      arquivo: file.name,
      tamanho: this.fileSize(file.size),
      tipo: file.type === 'application/pdf' ? 'PDF' : 'Arquivo',
      envio: stamp,
      processamento: stamp,
      status: 'Processando',
      acao: 'Aguardar'
    });
  }

  private fileSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    const kb = bytes / 1024;
    if (kb < 1024) {
      return `${Math.round(kb)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
  }

  private compareBySort(a: TableItem, b: TableItem, ordenacao: Ordenacao): number {
    if (ordenacao === 'envio_desc') {
      return this.toDateValue(b.envio) - this.toDateValue(a.envio);
    }

    if (ordenacao === 'envio_asc') {
      return this.toDateValue(a.envio) - this.toDateValue(b.envio);
    }

    if (ordenacao === 'processamento_desc') {
      return this.toDateValue(b.processamento) - this.toDateValue(a.processamento);
    }

    if (ordenacao === 'processamento_asc') {
      return this.toDateValue(a.processamento) - this.toDateValue(b.processamento);
    }

    const statusOrder: Record<TableItem['status'], number> = {
      Concluido: 1,
      Processando: 2,
      Erro: 3
    };
    return statusOrder[a.status] - statusOrder[b.status];
  }

  private toDateValue(value: string): number {
    const [datePart, timePart = '00:00'] = value.split(' ');
    const [day, month, year] = datePart.split('/').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    return new Date(year, month - 1, day, hour, minute).getTime();
  }
}
