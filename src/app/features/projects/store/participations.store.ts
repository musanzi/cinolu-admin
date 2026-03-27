import { computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IProjectParticipation } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterParticipationsDto } from '../dto/phases/filter-participations.dto';
import { MoveParticipationsDto } from '../dto/phases/move-participations.dto';
import { ReviewParticipationDto } from '../dto/participations/review-participation.dto';

interface ParticipationReview {
  id: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  message?: string | null;
  score: number;
}

interface ParticipationsStoreState {
  isLoading: boolean;
  isDetailLoading: boolean;
  isSaving: boolean;
  participations: [IProjectParticipation[], number];
  participation: IProjectParticipation | null;
  participationError: string | null;
}

export const ParticipationsStore = signalStore(
  withState<ParticipationsStoreState>({
    isLoading: false,
    isDetailLoading: false,
    isSaving: false,
    participations: [[], 0],
    participation: null,
    participationError: null
  }),
  withProps(() => ({
    _http: inject(HttpClient),
    _toast: inject(ToastrService)
  })),
  withComputed(({ participations }) => ({
    list: computed(() => participations()[0]),
    total: computed(() => participations()[1])
  })),
  withMethods(({ _http, _toast, ...store }) => ({
    loadAll: rxMethod<{ projectId: string; filters: FilterParticipationsDto }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ projectId, filters }) => {
          const params = buildQueryParams(filters);
          return _http
            .get<{ data: [IProjectParticipation[], number] }>(`projects/id/${projectId}/participations`, { params })
            .pipe(
              map(({ data }) => {
                patchState(store, { isLoading: false, participations: data });
              }),
              catchError(() => {
                patchState(store, { isLoading: false, participations: [[], 0] });
                return of(null);
              })
            );
        })
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isDetailLoading: true, participationError: null })),
        switchMap((participationId) =>
          _http.get<{ data: IProjectParticipation }>(`projects/participations/${participationId}`).pipe(
            map(({ data }) => {
              patchState(store, {
                isDetailLoading: false,
                participation: data,
                participationError: null
              });
            }),
            catchError((error) => {
              patchState(store, {
                isDetailLoading: false,
                participation: null,
                participationError: extractApiErrorMessage(error, 'Impossible de charger la participation')
              });
              return of(null);
            })
          )
        )
      )
    ),
    moveToPhase: rxMethod<MoveParticipationsDto & { onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ onSuccess, ...dto }) =>
          _http.post<void>('projects/participants/move', dto).pipe(
            tap(() => {
              patchState(store, { isSaving: false });
              _toast.showSuccess('Les participants ont été ajoutés à la phase');
              onSuccess?.();
            }),
            catchError((error) => {
              _toast.showError(
                extractApiErrorMessage(error, "Une erreur s'est produite lors du déplacement des participants")
              );
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    removeFromPhase: rxMethod<MoveParticipationsDto & { onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ onSuccess, ...dto }) =>
          _http.post<void>('projects/participants/remove', dto).pipe(
            tap(() => {
              patchState(store, { isSaving: false });
              _toast.showSuccess('Les participants ont été retirés de la phase');
              onSuccess?.();
            }),
            catchError((error) => {
              _toast.showError(
                extractApiErrorMessage(error, "Une erreur s'est produite lors du retrait des participants")
              );
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    review: rxMethod<{ participationId: string; dto: ReviewParticipationDto; onSuccess?: () => void }>(
      pipe(
        tap(() => patchState(store, { isSaving: true })),
        switchMap(({ participationId, dto, onSuccess }) =>
          _http.patch<{ data: ParticipationReview }>(`projects/participations/${participationId}/review`, dto).pipe(
            tap(() => {
              patchState(store, { isSaving: false });
              _toast.showSuccess(
                dto.notifyParticipant
                  ? 'La revue a été enregistrée et le participant a été notifié'
                  : 'La revue a été enregistrée'
              );
              onSuccess?.();
            }),
            catchError((error) => {
              _toast.showError(
                extractApiErrorMessage(error, "Une erreur s'est produite lors de l'enregistrement de la revue")
              );
              patchState(store, { isSaving: false });
              return of(null);
            })
          )
        )
      )
    ),
    clearParticipation(): void {
      patchState(store, { participation: null, participationError: null, isDetailLoading: false });
    }
  }))
);
