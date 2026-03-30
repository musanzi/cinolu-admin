import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IExpertise } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ExpertiseDto } from '../dto/expertises/expertise.dto';
import { FilterExpertisesDto } from '../dto/expertises/filter-expertises.dto';

@Injectable({ providedIn: 'root' })
export class ExpertisesService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterExpertisesDto): Observable<[IExpertise[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IExpertise[], number] }>('expertises/paginated', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les expertises');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getAllUnpaginated(): Observable<IExpertise[]> {
    return this.http.get<{ data: IExpertise[] }>('expertises').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les expertises');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: ExpertiseDto): Observable<IExpertise> {
    return this.http.post<{ data: IExpertise }>('expertises', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Expertise ajoutée avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de l'ajout de l'expertise");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, payload: ExpertiseDto): Observable<IExpertise> {
    return this.http.patch<{ data: IExpertise }>(`expertises/id/${id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Expertise mise à jour');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la mise à jour');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`expertises/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('Expertise supprimée avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de la suppression de l'expertise");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
