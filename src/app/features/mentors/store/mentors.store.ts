import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, debounceTime, distinctUntilChanged, EMPTY, finalize, map, of, pipe, switchMap, tap } from 'rxjs';
import { IMentorProfile } from '@shared/models';
import { FilterMentorsProfileDto } from '../dto/mentors/filter-mentors-profiles.dto';
import { CreateMentorDto } from '../dto/mentors/create-mentor.dto';
import { MentorsService } from '../services/mentors.service';

interface IMentorsStore {
  isLoading: boolean;
  isSaving: boolean;
  isSearchingUsers: boolean;
  userSearchTerm: string;
  searchedUsers: { email: string; name: string }[];
  mentors: [IMentorProfile[], number];
  mentor: IMentorProfile | null;
}

export const MentorsStore = signalStore(
  withState<IMentorsStore>({
    isLoading: false,
    isSaving: false,
    isSearchingUsers: false,
    userSearchTerm: '',
    searchedUsers: [],
    mentors: [[], 0],
    mentor: null
  }),
  withComputed(({ searchedUsers }) => ({
    userSearchOptions: computed(() =>
      searchedUsers().map((user) => ({ label: `${user.name} (${user.email})`, value: user.email }))
    )
  })),
  withProps(() => ({
    _mentorsService: inject(MentorsService)
  })),
  withMethods(({ _mentorsService, ...store }) => ({
    loadAll: rxMethod<FilterMentorsProfileDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _mentorsService.getAll(filters).pipe(
            tap({
              next: (mentors) => patchState(store, { isLoading: false, mentors })
            }),
            catchError(() => {
              patchState(store, { mentors: [[], 0] });
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
        switchMap((id) =>
          _mentorsService.getOne(id).pipe(
            tap({
              next: (mentor) => patchState(store, { isLoading: false, mentor })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    searchUsers: rxMethod<string>(
      pipe(
        map((term) => term.trim()),
        debounceTime(500),
        distinctUntilChanged(),
        switchMap((term) => {
          patchState(store, { userSearchTerm: term });
          if (term.length < 2) {
            patchState(store, { isSearchingUsers: false });
            return of(null);
          }

          patchState(store, { isSearchingUsers: true });
          return _mentorsService.searchUsers(term).pipe(
            tap({
              next: (searchedUsers) => patchState(store, { isSearchingUsers: false, searchedUsers })
            }),
            catchError(() => {
              patchState(store, { searchedUsers: [] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isSearchingUsers: false }))
          );
        })
      )
    ),
    approve: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _mentorsService.approve(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.mentors();
                const updated = list.map((m) => (m.id === data.id ? data : m));
                patchState(store, { isLoading: false, mentors: [updated, count], mentor: data });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    reject: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _mentorsService.reject(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.mentors();
                const updated = list.map((m) => (m.id === data.id ? data : m));
                patchState(store, { isLoading: false, mentors: [updated, count], mentor: data });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<CreateMentorDto>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap((dto) =>
          _mentorsService.create(dto).pipe(
            tap({
              next: (data) => {
                patchState(store, { isSaving: false, mentor: data });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isSaving: false }))
          )
        )
      )
    ),
    update: rxMethod<{ id: string; dto: CreateMentorDto }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ id, dto }) =>
          _mentorsService.update(id, dto).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.mentors();
                const updated = list.map((mentor) => (mentor.id === data.id ? data : mentor));
                patchState(store, { isSaving: false, mentors: [updated, count], mentor: data });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isSaving: false }))
          )
        )
      )
    )
  }))
);
