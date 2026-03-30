import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IEvent } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterEventCategoriesDto } from '../dto/categories/filter-categories.dto';
import { EventDto } from '../dto/events/event.dto';

@Injectable({ providedIn: 'root' })
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterEventCategoriesDto): Observable<[IEvent[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IEvent[], number] }>('events', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les événements');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getOne(slug: string): Observable<IEvent> {
    return this.http.get<{ data: IEvent }>(`events/by-slug/${slug}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Impossible de charger l'événement");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: EventDto): Observable<IEvent> {
    return this.http.post<{ data: IEvent }>('events', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess("L'événement a été ajouté avec succès");
        this.router.navigate(['/events']);
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(payload: EventDto): Observable<IEvent> {
    return this.http.patch<{ data: IEvent }>(`events/id/${payload.id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess("L'événement a été mis à jour avec succès");
        this.router.navigate(['/events']);
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
    return this.http.delete<void>(`events/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess("L'événement a été supprimé avec succès");
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la suppression");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  publish(id: string): Observable<IEvent> {
    return this.http.patch<{ data: IEvent }>(`events/id/${id}/publish`, {}).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors du changement de publication');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  showcase(id: string): Observable<IEvent> {
    return this.http.patch<{ data: IEvent }>(`events/id/${id}/highlight`, {}).pipe(
      map(({ data }) => {
        this.toast.showSuccess(
          data.is_highlighted ? 'Evénement mis en avant' : 'Evénement retiré des mises en avant'
        );
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Erreur lors de la mise en avant de l'Evénement");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
