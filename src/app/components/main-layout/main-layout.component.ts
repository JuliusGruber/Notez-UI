import { Component, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Note, NotePayload } from '../../models/note.model';
import { NotesService } from '../../services/notes.service';
import { NotesStateService, EditMode } from '../../services/notes-state.service';
import { NotesListComponent } from '../notes-list/notes-list.component';
import { NoteDetailComponent } from '../note-detail/note-detail.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatSnackBarModule,
    MatDialogModule,
    NotesListComponent,
    NoteDetailComponent
  ],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss'
})
export class MainLayoutComponent implements OnInit {
  searchControl = new FormControl('');
  isMobile = signal(false);
  showDetail = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private notesService: NotesService,
    public notesState: NotesStateService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {
    this.checkMobile();
  }

  @HostListener('window:resize')
  onResize(): void {
    this.checkMobile();
  }

  ngOnInit(): void {
    this.loadNotes();

    // Read note ID from URL on init
    this.route.params.subscribe(params => {
      if (params['id']) {
        this.notesState.selectNote(Number(params['id']));
        this.notesState.setEditMode('view');
        if (this.isMobile()) {
          this.showDetail.set(true);
        }
      }
    });

    // Setup search debounce
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => this.notesState.setSearchTerm(value ?? ''));
  }

  private checkMobile(): void {
    this.isMobile.set(window.innerWidth < 600);
  }

  private loadNotes(): void {
    this.notesState.setLoading(true);
    this.notesService.getAllNotes().subscribe({
      next: (notes) => {
        this.notesState.setNotes(notes);
        this.notesState.setLoading(false);
      },
      error: (error) => {
        this.notesState.setLoading(false);
        this.showError('Failed to load notes. Please try again.');
        console.error('Error loading notes:', error);
      }
    });
  }

  onNewNote(): void {
    if (this.notesState.hasUnsavedChanges()) {
      this.confirmDiscardChanges(() => {
        this.createNewNote();
      });
    } else {
      this.createNewNote();
    }
  }

  private createNewNote(): void {
    this.notesState.selectNote(null);
    this.notesState.setEditMode('create');
    if (this.isMobile()) {
      this.showDetail.set(true);
    }
    this.router.navigate(['/']);
  }

  onNoteSelected(note: Note): void {
    if (this.notesState.hasUnsavedChanges()) {
      this.confirmDiscardChanges(() => {
        this.selectNoteAndNavigate(note);
      });
    } else {
      this.selectNoteAndNavigate(note);
    }
  }

  private selectNoteAndNavigate(note: Note): void {
    this.notesState.selectNote(note.id!);
    this.notesState.setEditMode('view');
    this.notesState.setUnsavedChanges(false);
    if (this.isMobile()) {
      this.showDetail.set(true);
    }
    this.router.navigate(['/notes', note.id]);
  }

  private confirmDiscardChanges(onConfirm: () => void): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        noteTitle: 'Unsaved Changes'
      }
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.notesState.setUnsavedChanges(false);
        onConfirm();
      }
    });
  }

  onNoteSaved(payload: NotePayload): void {
    const mode = this.notesState.editMode();
    const selectedNote = this.notesState.selectedNote();

    if (mode === 'create') {
      this.notesService.createNote(payload).subscribe({
        next: (newNote) => {
          this.notesState.addNote(newNote);
          this.notesState.selectNote(newNote.id!);
          this.notesState.setEditMode('view');
          this.notesState.setUnsavedChanges(false);
          this.router.navigate(['/notes', newNote.id]);
          this.showSuccess('Note created successfully');
        },
        error: (error) => {
          this.handleError(error, 'create');
        }
      });
    } else if (mode === 'edit' && selectedNote) {
      this.notesService.updateNote(selectedNote.id!, payload).subscribe({
        next: (updatedNote) => {
          this.notesState.updateNoteInList(updatedNote);
          this.notesState.setEditMode('view');
          this.notesState.setUnsavedChanges(false);
          this.showSuccess('Note updated successfully');
        },
        error: (error) => {
          this.handleError(error, 'update');
        }
      });
    }
  }

  onNoteDeleted(id: number): void {
    this.notesService.deleteNote(id).subscribe({
      next: () => {
        this.notesState.removeNote(id);
        this.notesState.selectNote(null);
        this.notesState.setEditMode('view');
        if (this.isMobile()) {
          this.showDetail.set(false);
        }
        this.router.navigate(['/']);
        this.showSuccess('Note deleted successfully');
      },
      error: (error) => {
        this.handleError(error, 'delete');
      }
    });
  }

  onModeChange(mode: EditMode): void {
    this.notesState.setEditMode(mode);
    if (mode === 'view' && !this.notesState.selectedNote() && this.isMobile()) {
      this.showDetail.set(false);
    }
  }

  onBackToList(): void {
    if (this.notesState.hasUnsavedChanges()) {
      this.confirmDiscardChanges(() => {
        this.goBackToList();
      });
    } else {
      this.goBackToList();
    }
  }

  private goBackToList(): void {
    this.showDetail.set(false);
    this.notesState.setEditMode('view');
    this.notesState.setUnsavedChanges(false);
  }

  clearSearch(): void {
    this.searchControl.reset();
  }

  private handleError(error: any, operation: string): void {
    console.error(`Error during ${operation}:`, error);

    if (error.status === 400) {
      this.showError('Invalid data. Please check your input.');
    } else if (error.status === 404) {
      this.showError('Note not found. It may have been deleted.');
      this.loadNotes();
    } else if (error.status >= 500) {
      this.showError('Server error. Please try again later.');
    } else if (error.status === 0) {
      this.showError('Connection failed. Check your network.');
    } else {
      this.showError(`Failed to ${operation} note. Please try again.`);
    }
  }

  private showSuccess(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['success-snackbar']
    });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}
