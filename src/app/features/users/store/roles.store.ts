import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { IRole } from '@shared/models';
import { FilterRolesDto } from '../dto/roles/filter-roles.dto';
import { RoleDto } from '../dto/roles/role.dto';
import { RolesService } from '../services/roles.service';

interface IRolesStore {
  isLoading: boolean;
  roles: [IRole[], number];
  allRoles: IRole[];
}

export const RolesStore = signalStore(
  withState<IRolesStore>({ isLoading: false, roles: [[], 0], allRoles: [] }),
  withProps(() => ({
    _rolesService: inject(RolesService)
  })),
  withMethods(({ _rolesService, ...store }) => ({
    loadAll: rxMethod<FilterRolesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _rolesService.getAll(filters).pipe(
            tap({
              next: (roles) => patchState(store, { isLoading: false, roles })
            }),
            catchError(() => {
              patchState(store, { roles: [[], 0] });
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
          _rolesService.getAllUnpaginated().pipe(
            tap({
              next: (allRoles) => patchState(store, { isLoading: false, allRoles })
            }),
            catchError(() => {
              patchState(store, { allRoles: [] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<{ payload: { name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          _rolesService.create(payload).pipe(
            tap({
              next: (data) => {
                const [roles, count] = store.roles();
                patchState(store, {
                  isLoading: false,
                  roles: [[data, ...roles], count + 1],
                  allRoles: [data, ...store.allRoles()]
                });
                onSuccess();
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: RoleDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          _rolesService.update(id, payload).pipe(
            tap({
              next: (data) => {
                const [roles, count] = store.roles();
                const updated = roles.map((r) => (r.id === data.id ? data : r));
                const allUpdated = store.allRoles().map((r) => (r.id === data.id ? data : r));
                patchState(store, {
                  isLoading: false,
                  roles: [updated, count],
                  allRoles: allUpdated
                });
                onSuccess();
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
          _rolesService.delete(id).pipe(
            tap({
              next: () => {
                const [roles, count] = store.roles();
                const filtered = roles.filter((role) => role.id !== id);
                const allFiltered = store.allRoles().filter((r) => r.id !== id);
                patchState(store, {
                  isLoading: false,
                  roles: [filtered, Math.max(0, count - 1)],
                  allRoles: allFiltered
                });
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
