import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { buildQueryParams } from '@shared/helpers';
import { IProjectParticipation } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterParticipationsDto } from '../dto/phases/filter-participations.dto';
import { MoveParticipationsDto } from '../dto/phases/move-participations.dto';

interface ParticipationsStoreState {
  isLoading: boolean;
  isSaving: boolean;
  participations: [IProjectParticipation[], number];
}

export const ParticipationsStore = signalStore(
  withState<ParticipationsStoreState>({ isLoading: false, isSaving: false, participations: [[], 0] }),
  withProps(() => ({
    http: inject(HttpClient),
    toast: inject(ToastrService)
  })),
  withComputed(({ participations }) => ({
    list: computed(() => participations()[0]),
    total: computed(() => participations()[1])
  })),
  withMethods(({ http, toast, ...store }) => {
    const fail = (message: string, patch: Partial<ParticipationsStoreState> = {}) => {
      toast.showError(message);
      patchState(store, { isSaving: false, isLoading: false, ...patch });
      return of(null);
    };
    return {
      loadAll: rxMethod<{ projectId: string; filters: FilterParticipationsDto }>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(({ projectId, filters }) => {
            const params = buildQueryParams(filters);
            return http
              .get<{ data: [IProjectParticipation[], number] }>(`projects/${projectId}/participations`, { params })
              .pipe(
                tap(({ data }) => patchState(store, { isLoading: false, participations: data })),
                catchError(() => {
                  patchState(store, { isLoading: false, participations: [[], 0] });
                  return of(null);
                })
              );
          })
        )
      ),
      moveToPhase: rxMethod<MoveParticipationsDto & { onSuccess?: () => void }>(
        pipe(
          tap(() => patchState(store, { isSaving: true })),
          switchMap(({ onSuccess, ...dto }) =>
            http.post<void>('projects/participants/move', dto).pipe(
              tap(() => {
                patchState(store, { isSaving: false });
                toast.showSuccess('Les participants ont été ajoutés à la phase');
                onSuccess?.();
              }),
              catchError(() => fail("Une erreur s'est produite lors du déplacement des participants"))
            )
          )
        )
      ),
      removeFromPhase: rxMethod<MoveParticipationsDto & { onSuccess?: () => void }>(
        pipe(
          tap(() => patchState(store, { isSaving: true })),
          switchMap(({ onSuccess, ...dto }) =>
            http.post<void>('projects/participants/remove', dto).pipe(
              tap(() => {
                patchState(store, { isSaving: false });
                toast.showSuccess('Les participants ont été retirés de la phase');
                onSuccess?.();
              }),
              catchError(() => fail("Une erreur s'est produite lors du retrait des participants"))
            )
          )
        )
      ),
      clear(): void {
        patchState(store, { participations: [[], 0] });
      }
    };
  })
);
