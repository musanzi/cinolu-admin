import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
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
  withProps(() => ({
    _programSectorsService: inject(ProgramSectorsService)
  })),
  withMethods(({ _programSectorsService, ...store }) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() =>
          _programSectorsService.getAll().pipe(
            tap({
              next: (sectors) => patchState(store, { isLoading: false, sectors })
            }),
            catchError(() => {
              patchState(store, { sectors: [] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<{ payload: ProgramSectorDto; onSuccess: (sector: ISector) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _programSectorsService.create(payload).pipe(
            tap({
              next: (data) => {
                patchState(store, { isLoading: false, sectors: [data, ...store.sectors()] });
                onSuccess(data);
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: ProgramSectorDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          _programSectorsService.update(id, payload).pipe(
            tap({
              next: (data) => {
                const updated = store.sectors().map((sector) => (sector.id === data.id ? data : sector));
                patchState(store, { isLoading: false, sectors: updated });
                onSuccess();
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
          _programSectorsService.delete(id).pipe(
            tap({
              next: () => {
                const filtered = store.sectors().filter((sector) => sector.id !== id);
                patchState(store, { isLoading: false, sectors: filtered });
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
