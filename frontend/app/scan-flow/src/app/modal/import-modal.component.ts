import { Component, EventEmitter, HostListener, Output } from '@angular/core';

@Component({
  selector: 'app-import-modal',
  standalone: true,
  templateUrl: './import-modal.component.html',
  styleUrl: './import-modal.component.css'
})
export class ImportModalComponent {
  @Output() public closed = new EventEmitter<void>();
  @Output() public pdfSelected = new EventEmitter<File>();

  protected isDragging = false;
  protected selectedFileName = '';
  protected errorMessage = '';
  private selectedFile: File | null = null;

  protected close(): void {
    this.closed.emit();
  }

  @HostListener('document:dragover', ['$event'])
  protected preventBrowserDragover(event: DragEvent): void {
    event.preventDefault();
  }

  @HostListener('document:drop', ['$event'])
  protected preventBrowserDrop(event: DragEvent): void {
    event.preventDefault();
  }

  protected onDragEnter(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const file = event.dataTransfer?.files?.[0];
    this.processFile(file);
  }

  protected onDropzoneClick(fileInput: HTMLInputElement): void {
    fileInput.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.processFile(file);
  }

  protected import(): void {
    if (!this.selectedFile) {
      this.errorMessage = 'Selecione um arquivo PDF antes de importar.';
      return;
    }

    this.pdfSelected.emit(this.selectedFile);
    this.closed.emit();
  }

  private processFile(file: File | undefined): void {
    if (!file) {
      return;
    }

    const isPdfByType = file.type === 'application/pdf';
    const isPdfByName = file.name.toLowerCase().endsWith('.pdf');
    if (!isPdfByType && !isPdfByName) {
      this.errorMessage = 'Arquivo invalido. Envie apenas PDF.';
      this.selectedFileName = '';
      this.selectedFile = null;
      return;
    }

    this.errorMessage = '';
    this.selectedFileName = file.name;
    this.selectedFile = file;
  }
}
