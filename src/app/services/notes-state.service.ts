import { Injectable, signal, computed } from '@angular/core';
import { Note } from '../models/note.model';

export type EditMode = 'view' | 'edit' | 'create';

@Injectable({ providedIn: 'root' })
export class NotesStateService {
  // Core state using signals
  private _notes = signal<Note[]>([]);
  private _selectedNoteId = signal<number | null>(null);
  private _editMode = signal<EditMode>('view');
  private _isLoading = signal(false);
  private _hasUnsavedChanges = signal(false);
  private _searchTerm = signal('');
  private _sortBy = signal<'updatedAt' | 'createdAt' | 'title'>('updatedAt');
  private _sortOrder = signal<'asc' | 'desc'>('desc');

  // Public read-only signals
  readonly notes = this._notes.asReadonly();
  readonly selectedNoteId = this._selectedNoteId.asReadonly();
  readonly editMode = this._editMode.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly hasUnsavedChanges = this._hasUnsavedChanges.asReadonly();
  readonly searchTerm = this._searchTerm.asReadonly();
  readonly sortBy = this._sortBy.asReadonly();
  readonly sortOrder = this._sortOrder.asReadonly();

  // Computed signal for selected note
  readonly selectedNote = computed(() => {
    const id = this._selectedNoteId();
    return this._notes().find(n => n.id === id) ?? null;
  });

  // Computed signal for sorted notes
  readonly sortedNotes = computed(() => {
    const notes = [...this._notes()];
    const sortBy = this._sortBy();
    const order = this._sortOrder();

    return notes.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else {
        comparison = new Date(a[sortBy] ?? 0).getTime() - new Date(b[sortBy] ?? 0).getTime();
      }
      return order === 'desc' ? -comparison : comparison;
    });
  });

  // Computed signal for filtered and sorted notes
  readonly filteredNotes = computed(() => {
    const search = this._searchTerm().toLowerCase().trim();
    const notes = this.sortedNotes();

    if (!search) return notes;

    return notes.filter(note =>
      note.title.toLowerCase().includes(search) ||
      note.content.toLowerCase().includes(search)
    );
  });

  // State mutations
  setNotes(notes: Note[]): void {
    this._notes.set(notes);
  }

  addNote(note: Note): void {
    this._notes.update(notes => [...notes, note]);
  }

  updateNoteInList(updatedNote: Note): void {
    this._notes.update(notes =>
      notes.map(n => n.id === updatedNote.id ? updatedNote : n)
    );
  }

  removeNote(id: number): void {
    this._notes.update(notes => notes.filter(n => n.id !== id));
  }

  selectNote(id: number | null): void {
    this._selectedNoteId.set(id);
  }

  setEditMode(mode: EditMode): void {
    this._editMode.set(mode);
  }

  setLoading(loading: boolean): void {
    this._isLoading.set(loading);
  }

  setUnsavedChanges(dirty: boolean): void {
    this._hasUnsavedChanges.set(dirty);
  }

  setSearchTerm(term: string): void {
    this._searchTerm.set(term);
  }

  setSortBy(sortBy: 'updatedAt' | 'createdAt' | 'title'): void {
    this._sortBy.set(sortBy);
  }

  setSortOrder(order: 'asc' | 'desc'): void {
    this._sortOrder.set(order);
  }
}
