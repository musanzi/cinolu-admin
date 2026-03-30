import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
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
  withMethods((store) => {
    const service = inject(RolesService);

    return {
    loadAll: rxMethod<FilterRolesDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (roles) => patchState(store, { isLoading: false, roles }),
              error: () => patchState(store, { isLoading: false, roles: [[], 0] })
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
              next: (allRoles) => patchState(store, { isLoading: false, allRoles }),
              error: () => patchState(store, { isLoading: false, allRoles: [] })
            })
          )
        )
      )
    ),
    create: rxMethod<{ payload: { name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          service.create(payload).pipe(
            tap({
              next: (data) => {
              const [roles, count] = store.roles();
              patchState(store, {
                isLoading: false,
                roles: [[data, ...roles], count + 1],
                allRoles: [data, ...store.allRoles()]
              });
              onSuccess();
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: RoleDto; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          service.update(id, payload).pipe(
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
              const [roles, count] = store.roles();
              const filtered = roles.filter((role) => role.id !== id);
              const allFiltered = store.allRoles().filter((r) => r.id !== id);
              patchState(store, {
                isLoading: false,
                roles: [filtered, Math.max(0, count - 1)],
                allRoles: allFiltered
              });
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
