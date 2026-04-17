import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { ICategory } from '@shared/models';
import { FilterProjectCategoriesDto } from '../dto/categories/filter-categories.dto';
import { ProjectCategoryDto } from '../dto/categories/project-category.dto';
import { ProjectCategoriesService } from '../services/project-categories.service';

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
    _projectCategoriesService: inject(ProjectCategoriesService)
  })),
  withMethods(({ _projectCategoriesService, ...store }) => ({
    loadAll: rxMethod<FilterProjectCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _projectCategoriesService.getAll(filters).pipe(
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
          _projectCategoriesService.getAllUnpaginated().pipe(
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
    create: rxMethod<{ payload: ProjectCategoryDto; onSuccess: (category: ICategory) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _projectCategoriesService.create(payload).pipe(
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
          _projectCategoriesService.update(id, payload).pipe(
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
          _projectCategoriesService.delete(id).pipe(
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
