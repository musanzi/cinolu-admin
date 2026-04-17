import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, exhaustMap, finalize, pipe, switchMap, tap } from 'rxjs';
import { FilterProgramsDto } from '../dto/programs/filter-programs.dto';
import { Program } from '@shared/models';
import { ProgramDto } from '../dto/programs/program.dto';
import { ProgramsService } from '../services/programs.service';

interface IProgramsStore {
  isLoading: boolean;
  programs: [Program[], number];
  program: Program | null;
  allPrograms: Program[];
}

export const ProgramsStore = signalStore(
  withState<IProgramsStore>({ isLoading: false, programs: [[], 0], program: null, allPrograms: [] }),
  withProps(() => ({
    _programsService: inject(ProgramsService)
  })),
  withMethods(({ _programsService, ...store }) => ({
    loadAll: rxMethod<FilterProgramsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _programsService.getAll(filters).pipe(
            tap({
              next: (programs) => patchState(store, { isLoading: false, programs })
            }),
            catchError(() => {
              patchState(store, { programs: [[], 0] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    loadUnpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() =>
          _programsService.getAllUnpaginated().pipe(
            tap({
              next: (allPrograms) => patchState(store, { isLoading: false, allPrograms })
            }),
            catchError(() => {
              patchState(store, { allPrograms: [] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _programsService.getOne(slug).pipe(
            tap({
              next: (program) => patchState(store, { isLoading: false, program })
            }),
            catchError(() => {
              patchState(store, { program: null });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<ProgramDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _programsService.create(payload).pipe(
            tap({
              next: () => patchState(store, { isLoading: false })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<{ programId: string; payload: ProgramDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ programId, payload }) =>
          _programsService.update(programId, payload).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.programs();
                const updated = list.map((p) => (p.id === data.id ? data : p));
                patchState(store, { isLoading: false, program: data, programs: [updated, count] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _programsService.delete(id).pipe(
            tap({
              next: () => {
                const [programs, count] = store.programs();
                const filtered = programs.filter((program) => program.id !== id);
                patchState(store, { isLoading: false, programs: [filtered, Math.max(0, count - 1)] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),

    publishProgram: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _programsService.publish(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.programs();
                const updated = list.map((p) => (p.id === data.id ? data : p));
                patchState(store, { isLoading: false, program: data, programs: [updated, count] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    highlight: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _programsService.highlight(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.programs();
                const updated = list.map((p) => (p.id === data.id ? data : p));
                patchState(store, { isLoading: false, program: data, programs: [updated, count] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    )
  }))
);
