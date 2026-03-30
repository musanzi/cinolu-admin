import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
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
  withMethods((store) => {
    const service = inject(EventCategoriesService);

    return {
    loadAll: rxMethod<FilterEventCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (categories) => patchState(store, { isLoading: false, categories }),
              error: () => patchState(store, { isLoading: false, categories: [[], 0] })
            })
          )
        )
      )
    ),
    loadUnpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() =>
          service.getAllUnpaginated().pipe(
            tap({
              next: (allCategories) => patchState(store, { isLoading: false, allCategories }),
              error: () => patchState(store, { isLoading: false, allCategories: [] })
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: EventCategoryDto; onSuccess: (category: ICategory) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          service.create(payload).pipe(
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
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: { name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          service.update(id, payload).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.categories();
              const updated = list.map((c) => (c.id === data.id ? data : c));
              patchState(store, { isLoading: false, categories: [updated, count] });
              onSuccess();
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    delete: rxMethod<{ id: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id }) =>
          service.delete(id).pipe(
            tap({
              next: () => {
              const [list, count] = store.categories();
              const filtered = list.filter((c) => c.id !== id);
              patchState(store, { categories: [filtered, Math.max(0, count - 1)] });
              patchState(store, { isLoading: false });
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
