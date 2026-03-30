import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { computed, inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { debounceTime, distinctUntilChanged, map, of, pipe, switchMap, tap } from 'rxjs';
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
  withMethods((store) => {
    const service = inject(MentorsService);

    return {
      loadAll: rxMethod<FilterMentorsProfileDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (mentors) => patchState(store, { isLoading: false, mentors }),
              error: () => patchState(store, { isLoading: false, mentors: [[], 0] })
            })
          )
        )
      )
    ),
      loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.getOne(id).pipe(
            tap({
              next: (mentor) => patchState(store, { isLoading: false, mentor }),
              error: () => patchState(store, { isLoading: false })
            })
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
          return service.searchUsers(term).pipe(
            tap({
              next: (searchedUsers) => patchState(store, { isSearchingUsers: false, searchedUsers }),
              error: () => patchState(store, { isSearchingUsers: false, searchedUsers: [] })
            })
          );
        })
      )
    ),
      approve: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.approve(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.mentors();
                const updated = list.map((m) => (m.id === data.id ? data : m));
                patchState(store, { isLoading: false, mentors: [updated, count], mentor: data });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
      reject: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.reject(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.mentors();
                const updated = list.map((m) => (m.id === data.id ? data : m));
                patchState(store, { isLoading: false, mentors: [updated, count], mentor: data });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
      create: rxMethod<CreateMentorDto>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap((dto) =>
          service.create(dto).pipe(
            tap({
              next: (data) => {
                patchState(store, { isSaving: false, mentor: data });
              },
              error: () => patchState(store, { isSaving: false })
            })
          )
        )
      )
    ),
      update: rxMethod<{ id: string; dto: CreateMentorDto }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ id, dto }) =>
          service.update(id, dto).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.mentors();
                const updated = list.map((mentor) => (mentor.id === data.id ? data : mentor));
                patchState(store, { isSaving: false, mentors: [updated, count], mentor: data });
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
