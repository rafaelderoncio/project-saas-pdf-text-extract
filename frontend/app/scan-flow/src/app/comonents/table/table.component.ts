import { Component, Input } from '@angular/core';
import { TableItem } from '../../services/scan-flow.service';

@Component({
  selector: 'app-table',
  standalone: true,
  templateUrl: './table.component.html',
  styleUrl: './table.component.css'
})
export class TableComponent {
  @Input() public items: TableItem[] = [];
  @Input() public pageSize = 10;

  protected statusClass(status: TableItem['status']): string {
    if (status === 'Concluido') {
      return 'status-success';
    }

    if (status === 'Processando') {
      return 'status-process';
    }

    return 'status-error';
  }

  protected shouldEnableScroll(): boolean {
    return this.pageSize > 10;
  }

  protected isPassiveAction(action: string): boolean {
    return action.trim().toLowerCase() === 'aguardar';
  }
}
