import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IVenture } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterVenturesDto } from '../dto/filter-ventures.dto';

@Injectable({ providedIn: 'root' })
export class VenturesService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterVenturesDto): Observable<[IVenture[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IVenture[], number] }>('ventures', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les ventures');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getOne(slug: string): Observable<IVenture> {
    return this.http.get<{ data: IVenture }>(`ventures/by-slug/${slug}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger la venture');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  togglePublish(slug: string): Observable<IVenture> {
    return this.http.patch<{ data: IVenture }>(`ventures/by-slug/${slug}/publish`, {}).pipe(
      map(({ data }) => {
        this.toast.showSuccess(data.is_published ? 'Venture publiée avec succès' : 'Venture dépubliée avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors de la modification du statut de publication');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
