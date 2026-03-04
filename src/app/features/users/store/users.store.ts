import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { FilterUsersDto } from '../dto/users/filter-users.dto';
import { buildQueryParams } from '@shared/helpers';
import { User } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { Router } from '@angular/router';
import { UserDto } from '../dto/users/user.dto';

interface IUsersStore {
  isLoading: boolean;
  isUpdating: boolean;
  isDownloading: boolean;
  isImportingCsv: boolean;
  users: [User[], number];
  user: User | null;
  staff: User[];
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
    http: inject(HttpClient),
    toast: inject(ToastrService),
    router: inject(Router)
  })),
  withMethods(({ http, toast, router, ...store }) => ({
    loadAll: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return http.get<{ data: [User[], number] }>('users', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, users: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, users: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadStaff: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true } as Partial<IUsersStore>)),
        switchMap(() =>
          http.get<{ data: User[] }>('users/staff').pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, staff: data } as Partial<IUsersStore>);
            }),
            catchError(() => {
              patchState(store, { isLoading: false, staff: [] } as Partial<IUsersStore>);
              return of(null);
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((email) =>
          http.get<{ data: User }>(`users/${email}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, user: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, user: null });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<UserDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((dto) =>
          http.post<{ data: User }>('users', dto).pipe(
            map(({ data }) => {
              router.navigate(['/users']);
              toast.showSuccess('Utilisateur ajouté avec succès');
              patchState(store, { isLoading: false, user: data });
            }),
            catchError(() => {
              toast.showError("Erreur lors de l'ajout de l'utilisateur");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; dto: UserDto }>(
      pipe(
        tap(() => patchState(store, { isUpdating: true })),
        switchMap((params) =>
          http.patch<{ data: User }>(`users/${params.id}`, params.dto).pipe(
            map(({ data }) => {
              router.navigate(['/users']);
              toast.showSuccess('Utilisateur mis à jour avec succès');
              patchState(store, { isUpdating: false, user: data });
            }),
            catchError(() => {
              toast.showError("Erreur lors de la mise à jour de l'utilisateur");
              patchState(store, { isUpdating: false });
              return of(null);
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((userId) =>
          http.delete<void>(`users/${userId}`).pipe(
            map(() => {
              const [list, count] = store.users();
              const filtered = list.filter((u) => u.id !== userId);
              patchState(store, { isLoading: false, users: [filtered, Math.max(0, count - 1)] });
              toast.showSuccess('Utilisateur supprimé avec succès');
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              toast.showError("Échec de la suppression de l'utilisateur");
              return of(null);
            })
          )
        )
      )
    ),
    download: rxMethod<FilterUsersDto>(
      pipe(
        tap(() => patchState(store, { isDownloading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return http.get('users/export/users.csv', { params, responseType: 'blob' }).pipe(
            tap((blob) => {
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'users.csv';
              a.click();
              window.URL.revokeObjectURL(url);
              patchState(store, { isDownloading: false });
            }),
            catchError(() => {
              patchState(store, { isDownloading: false });
              return of(null);
            })
          );
        })
      )
    ),
    importCsv: rxMethod<{ file: File; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isImportingCsv: true })),
        switchMap(({ file, onSuccess }) => {
          const formData = new FormData();
          formData.append('file', file);
          return http.post<unknown>('users/import-csv', formData).pipe(
            tap(() => {
              toast.showSuccess('Utilisateurs importés avec succès');
              patchState(store, { isImportingCsv: false });
              onSuccess();
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de l'import des utilisateurs");
              patchState(store, { isImportingCsv: false });
              return of(null);
            })
          );
        })
      )
    )
  }))
);
