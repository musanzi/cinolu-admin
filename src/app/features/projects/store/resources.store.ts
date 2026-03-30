import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed } from '@angular/core';
import { pipe, switchMap, tap } from 'rxjs';
import { IResource } from '@shared/models';
import { CreateResourceDto, UpdateResourceDto } from '../dto/resources/create-resource.dto';
import { FilterResourcesDto } from '../dto/resources/filter-resources.dto';
import { ResourcesService } from '../services/resources.service';

interface ResourcesStoreState {
  isLoading: boolean;
  isSaving: boolean;
  resources: [IResource[], number];
}

export const ResourcesStore = signalStore(
  withState<ResourcesStoreState>({
    isLoading: false,
    isSaving: false,
    resources: [[], 0]
  }),
  withComputed(({ resources }) => ({
    list: computed(() => resources()[0]),
    total: computed(() => resources()[1])
  })),
  withMethods((store) => {
    const service = inject(ResourcesService);

    const upsert = (resource: IResource): void => {
      const [list, total] = store.resources();
      const exists = list.some((item) => item.id === resource.id);
      patchState(store, {
        resources: [
          exists ? list.map((item) => (item.id === resource.id ? resource : item)) : [resource, ...list],
          exists ? total : total + 1
        ]
      });
    };
    return {
      loadAll: rxMethod<{ projectId: string; filters: FilterResourcesDto }>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(({ projectId, filters }) =>
            service.getAll(projectId, filters).pipe(
              tap({
                next: (resources) => patchState(store, { isLoading: false, resources }),
                error: () => patchState(store, { isLoading: false, resources: [[], 0] })
              })
            )
          )
        )
      ),
      create: rxMethod<{ dto: CreateResourceDto; file: File; onSuccess?: () => void }>(
        pipe(
          tap(() => patchState(store, { isSaving: true })),
          switchMap(({ dto, file, onSuccess }) =>
            service.create(dto, file).pipe(
              tap({
                next: (data) => {
                upsert(data);
                patchState(store, { isSaving: false });
                onSuccess?.();
                },
                error: () => patchState(store, { isSaving: false })
              })
            )
          )
        )
      ),
      update: rxMethod<{ id: string; dto: UpdateResourceDto; onSuccess?: () => void }>(
        pipe(
          tap(() => patchState(store, { isSaving: true })),
          switchMap(({ id, dto, onSuccess }) =>
            service.update(id, dto).pipe(
              tap({
                next: (data) => {
                upsert(data);
                patchState(store, { isSaving: false });
                onSuccess?.();
                },
                error: () => patchState(store, { isSaving: false })
              })
            )
          )
        )
      ),
      replaceFile: rxMethod<{ id: string; file: File }>(
      pipe(
          tap(() => patchState(store, { isSaving: true })),
          switchMap(({ id, file }) => {
            return service.replaceFile(id, file).pipe(
              tap({
                next: (data) => {
                upsert(data);
                patchState(store, { isSaving: false });
                },
                error: () => patchState(store, { isSaving: false })
              })
            );
          })
        )
      ),
      delete: rxMethod<string>(
      pipe(
          tap(() => patchState(store, { isSaving: true })),
          switchMap((id) =>
            service.delete(id).pipe(
              tap({
                next: () => {
                const [list, total] = store.resources();
                patchState(store, {
                  isSaving: false,
                  resources: [list.filter((item) => item.id !== id), Math.max(0, total - 1)]
                });
                },
                error: () => patchState(store, { isSaving: false })
              })
            )
          )
        )
      )
    };
  })
);
