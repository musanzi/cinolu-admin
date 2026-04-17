import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
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
  withProps(() => ({
    _usersService: inject(UsersService)
  })),
  withMethods(({ _usersService, ...store }) => ({
    loadAll: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _usersService.getAll(filters).pipe(
            tap({
              next: (users) => patchState(store, { isLoading: false, users })
            }),
            catchError(() => {
              patchState(store, { users: [[], 0] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    loadStaff: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(() =>
          _usersService.getStaff().pipe(
            tap({
              next: (staff) => patchState(store, { isLoading: false, staff })
            }),
            catchError(() => {
              patchState(store, { staff: [] });
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
        switchMap((email) =>
          _usersService.getOne(email).pipe(
            tap({
              next: (user) => patchState(store, { isLoading: false, user })
            }),
            catchError(() => {
              patchState(store, { user: null });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<UserDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((dto) =>
          _usersService.create(dto).pipe(
            tap({
              next: (user) => patchState(store, { isLoading: false, user })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<{ id: string; dto: UserDto }>(
      pipe(
        tap(() => patchState(store, { isUpdating: true })),
        switchMap((params) =>
          _usersService.update(params.id, params.dto).pipe(
            tap({
              next: (user) => patchState(store, { isUpdating: false, user })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isUpdating: false }))
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((userId) =>
          _usersService.delete(userId).pipe(
            tap({
              next: () => {
                const [list, count] = store.users();
                const filtered = list.filter((u) => u.id !== userId);
                patchState(store, { isLoading: false, users: [filtered, Math.max(0, count - 1)] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    clear: rxMethod<{ onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ onSuccess }) =>
          _usersService.clearInvalidUsers().pipe(
            tap({
              next: () => {
                patchState(store, { isLoading: false });
                onSuccess();
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    download: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isDownloading: true })),
        switchMap((queryParams) =>
          _usersService.download(queryParams).pipe(
            tap({
              next: () => patchState(store, { isDownloading: false })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isDownloading: false }))
          )
        )
      )
    ),
    importCsv: rxMethod<{ file: File; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isImportingCsv: true })),
        switchMap(({ file, onSuccess }) =>
          _usersService.importCsv(file).pipe(
            tap({
              next: () => {
                patchState(store, { isImportingCsv: false });
                onSuccess();
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isImportingCsv: false }))
          )
        )
      )
    )
  }))
);
