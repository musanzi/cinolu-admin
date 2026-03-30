import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { IVenture } from '@shared/models';
import { FilterVenturesDto } from '../dto/filter-ventures.dto';
import { VenturesService } from '../services/ventures.service';

interface IVenturesStore {
  isLoading: boolean;
  ventures: [IVenture[], number];
  venture: IVenture | null;
}

export const VenturesStore = signalStore(
  withState<IVenturesStore>({
    isLoading: false,
    ventures: [[], 0],
    venture: null
  }),
  withMethods((store) => {
    const service = inject(VenturesService);

    return {
    loadAll: rxMethod<FilterVenturesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (ventures) => patchState(store, { isLoading: false, ventures }),
              error: () => patchState(store, { isLoading: false, ventures: [[], 0] })
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
              next: (venture) => patchState(store, { isLoading: false, venture }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    togglePublish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          service.togglePublish(slug).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.ventures();
              const updated = list.map((v) => (v.slug === data.slug ? data : v));
              patchState(store, { isLoading: false, ventures: [updated, count], venture: data });
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
