import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
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
  withProps(() => ({
    _statsService: inject(StatsService)
  })),
  withMethods(({ _statsService, ...store }) => ({
    loadGeneral: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoadingGeneral: true })),
        switchMap(() =>
          _statsService.getGeneral().pipe(
            tap({
              next: (general) => patchState(store, { isLoadingGeneral: false, general })
            }),
            catchError(() => {
              patchState(store, { general: null });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoadingGeneral: false }))
          )
        )
      )
    ),
    loadByYear: rxMethod<number>(
      pipe(
        tap((year) => patchState(store, { isLoadingByYear: true, selectedYear: year })),
        switchMap((year) =>
          _statsService.getByYear(year).pipe(
            tap({
              next: (byYear) => patchState(store, { isLoadingByYear: false, byYear })
            }),
            catchError(() => {
              patchState(store, { byYear: null });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoadingByYear: false }))
          )
        )
      )
    )
  }))
);
