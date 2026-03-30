import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { SubprogramDto } from '../dto/subprograms/subprogram.dto';
import { ISubprogram } from '@shared/models';
import { SubprogramsService } from '../services/subprograms.service';

interface IProgramsStore {
  isLoading: boolean;
  subprograms: ISubprogram[];
}

export const SubprogramsStore = signalStore(
  withState<IProgramsStore>({ isLoading: false, subprograms: [] }),
  withMethods((store) => {
    const service = inject(SubprogramsService);

    return {
    loadAll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.getAll(id).pipe(
            tap({
              next: (subprograms) => patchState(store, { isLoading: false, subprograms }),
              error: () => patchState(store, { isLoading: false, subprograms: [] })
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: SubprogramDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          service.create(payload).pipe(
            tap({
              next: (data) => {
              const list = store.subprograms();
              patchState(store, { subprograms: [data, ...list] });
              patchState(store, { isLoading: false });
              onSuccess();
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ payload: SubprogramDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          service.update(payload).pipe(
            tap({
              next: (data) => {
              const list = store.subprograms();
              const updated = list.map((sp) => (sp.id === data.id ? data : sp));
              patchState(store, { subprograms: updated });
              patchState(store, { isLoading: false });
              onSuccess();
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
              const list = store.subprograms();
              const filtered = list.filter((subprogram) => subprogram.id !== id);
              patchState(store, { subprograms: filtered, isLoading: false });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.publish(id).pipe(
            tap({
              next: (data) => {
              const list = store.subprograms();
              const updated = list.map((sp) => (sp.id === data.id ? data : sp));
              patchState(store, { subprograms: updated, isLoading: false });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.showcase(id).pipe(
            tap({
              next: (data) => {
              const list = store.subprograms();
              const updated = list.map((sp) => (sp.id === data.id ? data : sp));
              patchState(store, { subprograms: updated });
              patchState(store, { isLoading: false });
              },
              error: () => patchState(store, { isLoading: false })
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
              next: (subprograms) => patchState(store, { isLoading: false, subprograms }),
              error: () => patchState(store, { isLoading: false, subprograms: [] })
            })
          )
        )
      )
    )
  };
  })
);
