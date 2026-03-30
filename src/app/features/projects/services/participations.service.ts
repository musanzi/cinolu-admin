import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IProjectParticipation, IProjectParticipationReview } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterParticipationsDto } from '../dto/phases/filter-participations.dto';
import { MoveParticipationsDto } from '../dto/phases/move-participations.dto';
import {
  CreateParticipationReviewDto,
  ReviewParticipationDto,
  UpdateParticipationReviewDto
} from '../dto/participations/review-participation.dto';

interface ParticipationsResponse {
  participations: IProjectParticipation[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class ParticipationsService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(projectId: string, filters: FilterParticipationsDto): Observable<ParticipationsResponse> {
    const params = buildQueryParams(filters);
    
    return this.http
      .get<{ data: [IProjectParticipation[], number] }>(`projects/id/${projectId}/participations`, { params })
      .pipe(
        map(({ data }) => ({
          participations: data[0],
          total: data[1]
        })),
        catchError((error) => {
          const message = extractApiErrorMessage(error, 'Impossible de charger les participations');
          this.toast.showError(message);
          return throwError(() => message);
        })
      );
  }

  getOne(participationId: string): Observable<IProjectParticipation> {
    return this.http
      .get<{ data: IProjectParticipation }>(`projects/participations/${participationId}`)
      .pipe(
        map(({ data }) => data),
        catchError((error) => {
          const message = extractApiErrorMessage(error, 'Impossible de charger la participation');
          this.toast.showError(message);
          return throwError(() => message);
        })
      );
  }

  moveToPhase(dto: MoveParticipationsDto): Observable<void> {
    return this.http.post<void>('projects/participants/move', dto).pipe(
      map(() => {
        this.toast.showSuccess('Les participants ont été ajoutés à la phase');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(
          error,
          "Une erreur s'est produite lors du déplacement des participants"
        );
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  removeFromPhase(dto: MoveParticipationsDto): Observable<void> {
    return this.http.post<void>('projects/participants/remove', dto).pipe(
      map(() => {
        this.toast.showSuccess('Les participants ont été retirés de la phase');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(
          error,
          "Une erreur s'est produite lors du retrait des participants"
        );
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  review(participationId: string, dto: ReviewParticipationDto): Observable<IProjectParticipationReview> {
    if ('reviewId' in dto && dto.reviewId) {
      return this.updateReview(participationId, dto as UpdateParticipationReviewDto);
    }
    return this.createReview(participationId, dto as CreateParticipationReviewDto);
  }

  private createReview(
    participationId: string,
    dto: CreateParticipationReviewDto
  ): Observable<IProjectParticipationReview> {
    return this.http
      .post<{ data: IProjectParticipationReview }>(`projects/participations/${participationId}/review`, dto)
      .pipe(
        map(({ data }) => {
          const message = dto.notifyParticipant
            ? 'La revue a été enregistrée et le participant a été notifié'
            : 'La revue a été enregistrée';
          this.toast.showSuccess(message);
          return data;
        }),
        catchError((error) => {
          const message = extractApiErrorMessage(
            error,
            "Une erreur s'est produite lors de l'enregistrement de la revue"
          );
          this.toast.showError(message);
          return throwError(() => message);
        })
      );
  }

  private updateReview(
    participationId: string,
    dto: UpdateParticipationReviewDto
  ): Observable<IProjectParticipationReview> {
    const { reviewId, ...payload } = dto;
    
    return this.http
      .patch<{ data: IProjectParticipationReview }>(
        `projects/participations/${participationId}/review/${reviewId}`,
        payload
      )
      .pipe(
        map(({ data }) => {
          const message = payload.notifyParticipant
            ? 'La revue a été mise à jour et le participant a été notifié'
            : 'La revue a été mise à jour';
          this.toast.showSuccess(message);
          return data;
        }),
        catchError((error) => {
          const message = extractApiErrorMessage(
            error,
            "Une erreur s'est produite lors de la mise à jour de la revue"
          );
          this.toast.showError(message);
          return throwError(() => message);
        })
      );
  }
}
