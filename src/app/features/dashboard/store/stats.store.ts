import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import type { IGeneralStats, IStatsByYear } from '../types/stats.type';
import { StatsService } from '../services/stats.service';

interface IStatsStore {
  isLoadingGeneral: boolean;
  isLoadingByYear: boolean;
  general: IGeneralStats | null;
  byYear: IStatsByYear | null;
  selectedYear: number;
}

const currentYear = new Date().getFullYear();

export const StatsStore = signalStore(
  withState<IStatsStore>({
    isLoadingGeneral: false,
    isLoadingByYear: false,
    general: null,
    byYear: null,
    selectedYear: currentYear
  }),
  withMethods((store) => {
    const service = inject(StatsService);

    return {
    loadGeneral: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoadingGeneral: true })),
        switchMap(() =>
          service.getGeneral().pipe(
            tap({
              next: (general) => patchState(store, { isLoadingGeneral: false, general }),
              error: () => patchState(store, { isLoadingGeneral: false, general: null })
            })
          )
        )
      )
    ),
    loadByYear: rxMethod<number>(
      pipe(
        tap((year) => patchState(store, { isLoadingByYear: true, selectedYear: year })),
        switchMap((year) =>
          service.getByYear(year).pipe(
            tap({
              next: (byYear) => patchState(store, { isLoadingByYear: false, byYear }),
              error: () => patchState(store, { isLoadingByYear: false, byYear: null })
            })
          )
        )
      )
    )
  };
  })
);
