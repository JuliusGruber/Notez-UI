# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm start          # Start dev server at http://localhost:4200
npm run build      # Production build to dist/notez-app
npm test           # Run unit tests with Karma
ng test --include=**/notes-list.component.spec.ts  # Run single test file
```

## Architecture

This is an Angular 20 notes application using Angular Material and Angular Signals for state management. It connects to a Quarkus backend API.

### State Management Pattern

The app uses a **signals-based state service** (`NotesStateService`) as the single source of truth:
- Private writable signals for core state (`_notes`, `_selectedNoteId`, `_editMode`, etc.)
- Public readonly signals exposed via `.asReadonly()`
- Computed signals for derived state (`selectedNote`, `filteredNotes`, `sortedNotes`)

Components should use signals directly from `NotesStateService` rather than `@Input()` properties when immediate reactivity is needed. This avoids timing issues between signal updates and Input property propagation.

### Component Structure

- **MainLayoutComponent** - Orchestrates the app, handles API calls via `NotesService`, delegates to state service
- **NotesListComponent** - Displays filtered/sorted notes list
- **NoteDetailComponent** - Shows note view/edit/create modes using computed signals from state service
- **NoteFormComponent** - Reusable form for create/edit
- **ConfirmDialogComponent** - Reusable confirmation dialog

### Services

- **NotesService** - HTTP client for REST API (`/api/v1/notes`)
- **NotesStateService** - Signal-based state management (no NgRx/RxJS stores)

### API Configuration

Backend URL configured in `src/environments/environment.ts`. Default: `/api/v1` (expects proxy or same-origin backend).

### Key Patterns

- All components are standalone (no NgModules)
- Mobile-responsive with breakpoint at 600px
- Uses Angular's new control flow syntax (`@if`, `@for`)
- Prettier configured with Angular HTML parser
