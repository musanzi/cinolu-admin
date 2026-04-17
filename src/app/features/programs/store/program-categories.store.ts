import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { ICategory } from '@shared/models';
import { FilterProgramCategoriesDto } from '../dto/categories/filter-categories.dto';
import { ProgramCategoryDto } from '../dto/categories/program-category.dto';
import { ProgramCategoriesService } from '../services/program-categories.service';

interface ICategoriesStore {
  isLoading: boolean;
  categories: [ICategory[], number];
  allCategories: ICategory[];
}

export const ProgramCategoriesStore = signalStore(
  withState<ICategoriesStore>({
    isLoading: false,
    categories: [[], 0],
    allCategories: []
  }),
  withProps(() => ({
    _programCategoriesService: inject(ProgramCategoriesService)
  })),
  withMethods(({ _programCategoriesService, ...store }) => ({
    loadAll: rxMethod<FilterProgramCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _programCategoriesService.getAll(filters).pipe(
            tap({
              next: (categories) => patchState(store, { isLoading: false, categories })
            }),
            catchError(() => {
              patchState(store, { categories: [[], 0] });
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
        switchMap(() =>
          _programCategoriesService.getAllUnpaginated().pipe(
            tap({
              next: (allCategories) => patchState(store, { isLoading: false, allCategories })
            }),
            catchError(() => {
              patchState(store, { allCategories: [] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<{ payload: { name: string; color?: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _programCategoriesService.create(payload).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.categories();
                patchState(store, { isLoading: false, categories: [[data, ...list], count + 1] });
                onSuccess();
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: ProgramCategoryDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          _programCategoriesService.update(id, payload).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.categories();
                const updated = list.map((c) => (c.id === data.id ? data : c));
                patchState(store, { isLoading: false, categories: [updated, count] });
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
          _programCategoriesService.delete(id).pipe(
            tap({
              next: () => {
                const [list, count] = store.categories();
                const filtered = list.filter((c) => c.id !== id);
                patchState(store, { categories: [filtered, Math.max(0, count - 1)] });
                patchState(store, { isLoading: false });
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
