import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { FilterUsersDto } from '../dto/users/filter-users.dto';
import { IUser } from '@shared/models';
import { UserDto } from '../dto/users/user.dto';
import { UsersService } from '../services/users.service';

interface IUsersStore {
  isLoading: boolean;
  isUpdating: boolean;
  isDownloading: boolean;
  isImportingCsv: boolean;
  users: [IUser[], number];
  user: IUser | null;
  staff: IUser[];
}

export const UsersStore = signalStore(
  withState<IUsersStore>({
    isLoading: false,
    isUpdating: false,
    isImportingCsv: false,
    isDownloading: false,
    users: [[], 0],
    user: null,
    staff: []
  }),
  withMethods((store) => {
    const service = inject(UsersService);

    return {
    loadAll: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (users) => patchState(store, { isLoading: false, users }),
              error: () => patchState(store, { isLoading: false, users: [[], 0] })
            })
          )
        )
      )
    ),
    loadStaff: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() =>
          service.getStaff().pipe(
            tap({
              next: (staff) => patchState(store, { isLoading: false, staff }),
              error: () => patchState(store, { isLoading: false, staff: [] })
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((email) =>
          service.getOne(email).pipe(
            tap({
              next: (user) => patchState(store, { isLoading: false, user }),
              error: () => patchState(store, { isLoading: false, user: null })
            })
          )
        )
      )
    ),
    create: rxMethod<UserDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((dto) =>
          service.create(dto).pipe(
            tap({
              next: (user) => patchState(store, { isLoading: false, user }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; dto: UserDto }>(
      pipe(
        tap(() => patchState(store, { isUpdating: true })),
        switchMap((params) =>
          service.update(params.id, params.dto).pipe(
            tap({
              next: (user) => patchState(store, { isUpdating: false, user }),
              error: () => patchState(store, { isUpdating: false })
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((userId) =>
          service.delete(userId).pipe(
            tap({
              next: () => {
              const [list, count] = store.users();
              const filtered = list.filter((u) => u.id !== userId);
              patchState(store, { isLoading: false, users: [filtered, Math.max(0, count - 1)] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    clear: rxMethod<{ onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ onSuccess }) =>
          service.clearInvalidUsers().pipe(
            tap({
              next: () => {
                patchState(store, { isLoading: false });
                onSuccess();
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    download: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isDownloading: true })),
        switchMap((queryParams) =>
          service.download(queryParams).pipe(
            tap({
              next: () => patchState(store, { isDownloading: false }),
              error: () => patchState(store, { isDownloading: false })
            })
          )
        )
      )
    ),
    importCsv: rxMethod<{ file: File; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isImportingCsv: true })),
        switchMap(({ file, onSuccess }) =>
          service.importCsv(file).pipe(
            tap({
              next: () => {
                patchState(store, { isImportingCsv: false });
                onSuccess();
              },
              error: () => patchState(store, { isImportingCsv: false })
            })
          )
        )
      )
    )
  };
  })
);
