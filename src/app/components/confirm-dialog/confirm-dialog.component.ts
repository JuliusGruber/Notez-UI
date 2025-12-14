import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export interface ConfirmDialogData {
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'accent' | 'warn';
  noteTitle?: string; // For backwards compatibility
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ dialogTitle }}</h2>
    <mat-dialog-content>
      {{ dialogMessage }}
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>{{ data.cancelText || 'Cancel' }}</button>
      <button mat-button [color]="data.confirmColor || 'warn'" [mat-dialog-close]="true">
        {{ data.confirmText || 'Confirm' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    mat-dialog-content {
      padding: 20px 24px;
    }
    mat-dialog-actions {
      padding: 8px 24px 16px;
    }
  `]
})
export class ConfirmDialogComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData) {}

  get dialogTitle(): string {
    if (this.data.title) return this.data.title;
    if (this.data.noteTitle === 'Unsaved Changes') return 'Unsaved Changes';
    return 'Delete Note';
  }

  get dialogMessage(): string {
    if (this.data.message) return this.data.message;
    if (this.data.noteTitle === 'Unsaved Changes') {
      return 'You have unsaved changes. Discard them?';
    }
    return `Are you sure you want to delete "${this.data.noteTitle}"?`;
  }
}
