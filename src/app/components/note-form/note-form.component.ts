import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Note, NotePayload } from '../../models/note.model';
import { NotesStateService } from '../../services/notes-state.service';

@Component({
  selector: 'app-note-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './note-form.component.html',
  styleUrl: './note-form.component.scss'
})
export class NoteFormComponent implements OnInit, OnChanges {
  @Input() note: Note | null = null;
  @Output() save = new EventEmitter<NotePayload>();
  @Output() cancel = new EventEmitter<void>();

  noteForm!: FormGroup;
  isSaving = false;

  constructor(
    private fb: FormBuilder,
    private notesState: NotesStateService
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['note'] && this.noteForm) {
      this.updateForm();
    }
  }

  private initForm(): void {
    this.noteForm = this.fb.group({
      title: [this.note?.title ?? '', [
        Validators.required,
        Validators.maxLength(200),
        Validators.pattern(/.*\S.*/)
      ]],
      content: [this.note?.content ?? '', [
        Validators.required,
        Validators.maxLength(10000)
      ]]
    });

    this.noteForm.valueChanges.subscribe(() => {
      this.notesState.setUnsavedChanges(this.noteForm.dirty);
    });
  }

  private updateForm(): void {
    this.noteForm.patchValue({
      title: this.note?.title ?? '',
      content: this.note?.content ?? ''
    });
    this.noteForm.markAsPristine();
    this.notesState.setUnsavedChanges(false);
  }

  onSubmit(): void {
    if (this.noteForm.valid) {
      this.isSaving = true;
      const payload: NotePayload = {
        title: this.noteForm.value.title.trim(),
        content: this.noteForm.value.content
      };
      this.save.emit(payload);
    }
  }

  onCancel(): void {
    this.notesState.setUnsavedChanges(false);
    this.cancel.emit();
  }

  get isEditMode(): boolean {
    return this.note !== null;
  }
}
