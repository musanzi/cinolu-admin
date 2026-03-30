import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap, exhaustMap } from 'rxjs';
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
  withMethods((store) => {
    const service = inject(ProgramsService);

    return {
    loadAll: rxMethod<FilterProgramsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (programs) => patchState(store, { isLoading: false, programs }),
              error: () => patchState(store, { isLoading: false, programs: [[], 0] })
            })
          )
        )
      )
    ),
    loadUnpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() =>
          service.getAllUnpaginated().pipe(
            tap({
              next: (allPrograms) => patchState(store, { isLoading: false, allPrograms }),
              error: () => patchState(store, { isLoading: false, allPrograms: [] })
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          service.getOne(slug).pipe(
            tap({
              next: (program) => patchState(store, { isLoading: false, program }),
              error: () => patchState(store, { isLoading: false, program: null })
            })
          )
        )
      )
    ),
    create: rxMethod<ProgramDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          service.create(payload).pipe(
            tap({
              next: () => patchState(store, { isLoading: false }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ programId: string; payload: ProgramDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ programId, payload }) =>
          service.update(programId, payload).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.programs();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, program: data, programs: [updated, count] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.delete(id).pipe(
            tap({
              next: () => {
              const [programs, count] = store.programs();
              const filtered = programs.filter((program) => program.id !== id);
              patchState(store, { isLoading: false, programs: [filtered, Math.max(0, count - 1)] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),

    // Publish / Highlight
    publishProgram: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.publish(id).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.programs();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, program: data, programs: [updated, count] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    highlight: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.highlight(id).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.programs();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, program: data, programs: [updated, count] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    )
  };
  })
);
