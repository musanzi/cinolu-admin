import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { ICategory } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterEventCategoriesDto } from '../dto/categories/filter-categories.dto';
import { EventCategoryDto } from '../dto/events/event-category.dto';

@Injectable({ providedIn: 'root' })
export class EventCategoriesService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterEventCategoriesDto): Observable<[ICategory[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [ICategory[], number] }>('event-categories/paginated', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les catégories');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getAllUnpaginated(): Observable<ICategory[]> {
    return this.http.get<{ data: ICategory[] }>('event-categories').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les catégories');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: EventCategoryDto): Observable<ICategory> {
    return this.http.post<{ data: ICategory }>('event-categories', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Catégorie ajoutée avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de l'ajout de la catégorie");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, payload: { name: string }): Observable<ICategory> {
    return this.http.patch<{ data: ICategory }>(`event-categories/id/${id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Catégorie mise à jour');
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
    return this.http.delete<void>(`event-categories/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('Catégorie supprimée avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la suppression de la catégorie');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
