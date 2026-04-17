import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
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
  withProps(() => ({
    _eventsService: inject(EventsService)
  })),
  withMethods(({ _eventsService, ...store }) => ({
    loadAll: rxMethod<FilterEventCategoriesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _eventsService.getAll(filters).pipe(
            tap({
              next: (events) => patchState(store, { isLoading: false, events })
            }),
            catchError(() => {
              patchState(store, { events: [[], 0] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _eventsService.getOne(slug).pipe(
            tap({
              next: (event) => patchState(store, { isLoading: false, event })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<EventDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _eventsService.create(payload).pipe(
            tap({
              next: (event) => patchState(store, { isLoading: false, event })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<EventDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _eventsService.update(payload).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.events();
                const updated = list.map((e) => (e.id === data.id ? data : e));
                patchState(store, { isLoading: false, event: data, events: [updated, count] });
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
          _eventsService.delete(id).pipe(
            tap({
              next: () => {
                const [list, count] = store.events();
                const filtered = list.filter((e) => e.id !== id);
                patchState(store, { isLoading: false, events: [filtered, Math.max(0, count - 1)] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _eventsService.publish(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.events();
                const updated = list.map((e) => (e.id === data.id ? data : e));
                patchState(store, { isLoading: false, events: [updated, count], event: data });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _eventsService.showcase(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.events();
                const updated = list.map((e) => (e.id === data.id ? data : e));
                patchState(store, { isLoading: false, events: [updated, count], event: data });
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
