import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { IEvent } from '@shared/models';
import { FilterEventCategoriesDto } from '../dto/categories/filter-categories.dto';
import { EventDto } from '../dto/events/event.dto';
import { EventsService } from '../services/events.service';

interface IEventsStore {
  isLoading: boolean;
  events: [IEvent[], number];
  event: IEvent | null;
}

export const EventsStore = signalStore(
  withState<IEventsStore>({
    isLoading: false,
    events: [[], 0],
    event: null
  }),
  withMethods((store) => {
    const service = inject(EventsService);

    return {
    loadAll: rxMethod<FilterEventCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (events) => patchState(store, { isLoading: false, events }),
              error: () => patchState(store, { isLoading: false, events: [[], 0] })
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
              next: (event) => patchState(store, { isLoading: false, event }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    create: rxMethod<EventDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          service.create(payload).pipe(
            tap({
              next: (event) => patchState(store, { isLoading: false, event }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<EventDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          service.update(payload).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.events();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              patchState(store, { isLoading: false, event: data, events: [updated, count] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.delete(id).pipe(
            tap({
              next: () => {
              const [list, count] = store.events();
              const filtered = list.filter((e) => e.id !== id);
              patchState(store, { isLoading: false, events: [filtered, Math.max(0, count - 1)] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.publish(id).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.events();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              patchState(store, { isLoading: false, events: [updated, count], event: data });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.showcase(id).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.events();
              const updated = list.map((e) => (e.id === data.id ? data : e));
              patchState(store, { isLoading: false, events: [updated, count], event: data });
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
