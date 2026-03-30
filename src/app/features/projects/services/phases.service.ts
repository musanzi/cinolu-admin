import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { extractApiErrorMessage } from '@shared/helpers';
import { IMentorProfile, IPhase } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { PhaseDto } from '../dto/phases/phase.dto';

@Injectable({ providedIn: 'root' })
export class PhasesService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(projectId: string): Observable<IPhase[]> {
    return this.http.get<{ data: IPhase[] }>(`phases/project/${projectId}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les phases');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getMentors(): Observable<IMentorProfile[]> {
    return this.http.get<{ data: IMentorProfile[] }>('mentors').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les mentors');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(projectId: string, dto: PhaseDto): Observable<IPhase> {
    const payload = { ...dto };
    delete payload.id;

    return this.http.post<{ data: IPhase }>(`phases/project/${projectId}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('La phase a été créée avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la création de la phase");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(dto: PhaseDto & { id: string }): Observable<IPhase> {
    return this.http.patch<{ data: IPhase }>(`phases/id/${dto.id}`, dto).pipe(
      map(({ data }) => {
        this.toast.showSuccess('La phase a été mise à jour avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la mise à jour");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`phases/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('La phase a été supprimée avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la suppression");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
