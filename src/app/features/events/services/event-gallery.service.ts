import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { extractApiErrorMessage } from '@shared/helpers';
import { IImage } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';

@Injectable({ providedIn: 'root' })
export class EventGalleryService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(slug: string): Observable<IImage[]> {
    return this.http.get<{ data: IImage[] }>(`events/by-slug/${slug}/gallery`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Impossible de charger la galerie de l'événement");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`events/gallery/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('Image supprimée avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de la suppression de l'image");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
