import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { ICategory } from '@shared/models';
import { FilterEventCategoriesDto } from '../dto/categories/filter-categories.dto';
import { EventCategoryDto } from '../dto/events/event-category.dto';
import { EventCategoriesService } from '../services/event-categories.service';

interface ICategoriesStore {
  isLoading: boolean;
  categories: [ICategory[], number];
  allCategories: ICategory[];
}

export const CategoriesStore = signalStore(
  withState<ICategoriesStore>({
    isLoading: false,
    categories: [[], 0],
    allCategories: []
  }),
  withProps(() => ({
    _eventCategoriesService: inject(EventCategoriesService)
  })),
  withMethods(({ _eventCategoriesService, ...store }) => ({
    loadAll: rxMethod<FilterEventCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _eventCategoriesService.getAll(filters).pipe(
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
          _eventCategoriesService.getAllUnpaginated().pipe(
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
    create: rxMethod<{ payload: EventCategoryDto; onSuccess: (category: ICategory) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _eventCategoriesService.create(payload).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.categories();
                const allCategories = store.allCategories();
                const hasCategory = allCategories.some((category) => category.id === data.id);
                patchState(store, {
                  isLoading: false,
                  categories: [[data, ...list], count + 1],
                  allCategories: hasCategory ? allCategories : [data, ...allCategories]
                });
                onSuccess(data);
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: { name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          _eventCategoriesService.update(id, payload).pipe(
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
    delete: rxMethod<{ id: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id }) =>
          _eventCategoriesService.delete(id).pipe(
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
