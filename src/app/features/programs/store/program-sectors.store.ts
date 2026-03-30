import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { ISector } from '@shared/models';
import { ProgramSectorDto } from '../dto/sectors/program-sector.dto';
import { ProgramSectorsService } from '../services/program-sectors.service';

interface IProgramSectorsStore {
  isLoading: boolean;
  sectors: ISector[];
}

export const ProgramSectorsStore = signalStore(
  withState<IProgramSectorsStore>({
    isLoading: false,
    sectors: []
  }),
  withMethods((store) => {
    const service = inject(ProgramSectorsService);

    return {
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() =>
          service.getAll().pipe(
            tap({
              next: (sectors) => patchState(store, { isLoading: false, sectors }),
              error: () => patchState(store, { isLoading: false, sectors: [] })
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: ProgramSectorDto; onSuccess: (sector: ISector) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          service.create(payload).pipe(
            tap({
              next: (data) => {
              patchState(store, { isLoading: false, sectors: [data, ...store.sectors()] });
              onSuccess(data);
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: ProgramSectorDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          service.update(id, payload).pipe(
            tap({
              next: (data) => {
              const updated = store.sectors().map((sector) => (sector.id === data.id ? data : sector));
              patchState(store, { isLoading: false, sectors: updated });
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
              const filtered = store.sectors().filter((sector) => sector.id !== id);
              patchState(store, { isLoading: false, sectors: filtered });
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
