import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Note, NotePayload } from '../../models/note.model';
import { NoteFormComponent } from '../note-form/note-form.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { NotesStateService, EditMode } from '../../services/notes-state.service';

@Component({
  selector: 'app-note-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    NoteFormComponent
  ],
  templateUrl: './note-detail.component.html',
  styleUrl: './note-detail.component.scss'
})
export class NoteDetailComponent {
  @Input() note: Note | null = null;
  @Input() mode: EditMode = 'view';
  @Output() save = new EventEmitter<NotePayload>();
  @Output() delete = new EventEmitter<string>();
  @Output() modeChange = new EventEmitter<EditMode>();

  constructor(
    private dialog: MatDialog,
    private notesState: NotesStateService
  ) {}

  enterEditMode(): void {
    this.modeChange.emit('edit');
  }

  confirmDelete(): void {
    if (!this.note) return;

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: { noteTitle: this.note.title }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed && this.note?.id) {
        this.delete.emit(this.note.id);
      }
    });
  }

  onSave(payload: NotePayload): void {
    this.save.emit(payload);
  }

  onCancel(): void {
    if (this.note) {
      this.modeChange.emit('view');
    } else {
      this.modeChange.emit('view');
    }
  }
}
