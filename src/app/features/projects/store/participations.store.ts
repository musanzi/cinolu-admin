import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { IProjectParticipation } from '@shared/models';
import { FilterParticipationsDto } from '../dto/phases/filter-participations.dto';
import { MoveParticipationsDto } from '../dto/phases/move-participations.dto';
import { ReviewParticipationDto } from '../dto/participations/review-participation.dto';
import { ParticipationsService } from '../services/participations.service';

interface ParticipationsStoreState {
  isLoading: boolean;
  isDetailLoading: boolean;
  isSaving: boolean;
  participations: IProjectParticipation[];
  total: number;
  participation: IProjectParticipation | null;
  error: string | null;
}

export const ParticipationsStore = signalStore(
  withState<ParticipationsStoreState>({
    isLoading: false,
    isDetailLoading: false,
    isSaving: false,
    participations: [],
    total: 0,
    participation: null,
    error: null
  }),
  withComputed(({ participations, error }) => ({
    hasParticipations: computed(() => participations().length > 0),
    isEmpty: computed(() => participations().length === 0 && !error()),
    hasError: computed(() => !!error())
  })),
  withMethods((store) => {
    const service = inject(ParticipationsService);

    return {
      loadAll: rxMethod<{ projectId: string; filters: FilterParticipationsDto }>(
        pipe(
          tap(() => patchState(store, { isLoading: true, error: null })),
          switchMap(({ projectId, filters }) =>
            service.getAll(projectId, filters).pipe(
              tap({
                next: ({ participations, total }) => {
                  patchState(store, { 
                    isLoading: false, 
                    participations, 
                    total,
                    error: null 
                  });
                },
                error: (error) => {
                  patchState(store, { 
                    isLoading: false, 
                    participations: [], 
                    total: 0,
                    error 
                  });
                }
              })
            )
          )
        )
      ),

      loadOne: rxMethod<string>(
        pipe(
          tap(() => patchState(store, { isDetailLoading: true, error: null })),
          switchMap((participationId) =>
            service.getOne(participationId).pipe(
              tap({
                next: (participation) => {
                  patchState(store, {
                    isDetailLoading: false,
                    participation,
                    error: null
                  });
                },
                error: (error) => {
                  patchState(store, {
                    isDetailLoading: false,
                    participation: null,
                    error
                  });
                }
              })
            )
          )
        )
      ),

      moveToPhase: rxMethod<MoveParticipationsDto>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap((dto) =>
            service.moveToPhase(dto).pipe(
              tap({
                next: () => {
                  patchState(store, { isSaving: false, error: null });
                },
                error: (error) => {
                  patchState(store, { isSaving: false, error });
                }
              })
            )
          )
        )
      ),

      removeFromPhase: rxMethod<MoveParticipationsDto>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap((dto) =>
            service.removeFromPhase(dto).pipe(
              tap({
                next: () => {
                  patchState(store, { isSaving: false, error: null });
                },
                error: (error) => {
                  patchState(store, { isSaving: false, error });
                }
              })
            )
          )
        )
      ),

      review: rxMethod<{ participationId: string; dto: ReviewParticipationDto }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ participationId, dto }) =>
            service.review(participationId, dto).pipe(
              tap({
                next: () => {
                  patchState(store, { isSaving: false, error: null });
                },
                error: (error) => {
                  patchState(store, { isSaving: false, error });
                }
              })
            )
          )
        )
      ),

      clearParticipation(): void {
        patchState(store, { 
          participation: null, 
          error: null, 
          isDetailLoading: false 
        });
      },

      resetState(): void {
        patchState(store, {
          isLoading: false,
          isDetailLoading: false,
          isSaving: false,
          participations: [],
          total: 0,
          participation: null,
          error: null
        });
      }
    };
  })
);
