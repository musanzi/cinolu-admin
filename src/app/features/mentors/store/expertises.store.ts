import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { IExpertise } from '@shared/models';
import { FilterExpertisesDto } from '../dto/expertises/filter-expertises.dto';
import { ExpertiseDto } from '../dto/expertises/expertise.dto';
import { ExpertisesService } from '../services/expertises.service';

interface IExpertisesStore {
  isLoading: boolean;
  expertises: [IExpertise[], number];
  allExpertises: IExpertise[];
}

export const ExpertisesStore = signalStore(
  withState<IExpertisesStore>({
    isLoading: false,
    expertises: [[], 0],
    allExpertises: []
  }),
  withMethods((store) => {
    const service = inject(ExpertisesService);

    return {
    loadAll: rxMethod<FilterExpertisesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (expertises) => patchState(store, { isLoading: false, expertises }),
              error: () => patchState(store, { isLoading: false, expertises: [[], 0] })
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
              next: (allExpertises) => patchState(store, { isLoading: false, allExpertises }),
              error: () => patchState(store, { isLoading: false, allExpertises: [] })
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: ExpertiseDto; onSuccess: (expertise: IExpertise) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          service.create(payload).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.expertises();
              const nextAllExpertises = [
                data,
                ...store.allExpertises().filter((expertise) => expertise.id !== data.id)
              ];
              patchState(store, {
                isLoading: false,
                expertises: [[data, ...list], count + 1],
                allExpertises: nextAllExpertises
              });
              onSuccess(data);
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: ExpertiseDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          service.update(id, payload).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.expertises();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              const allExpertises = store
                .allExpertises()
                .map((expertise) => (expertise.id === data.id ? data : expertise));
              patchState(store, { isLoading: false, expertises: [updated, count], allExpertises });
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
              const [list, count] = store.expertises();
              const filtered = list.filter((e) => e.id !== id);
              const allExpertises = store.allExpertises().filter((expertise) => expertise.id !== id);
              patchState(store, { expertises: [filtered, Math.max(0, count - 1)], allExpertises });
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
