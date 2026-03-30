import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { ITag } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ArticleTagDto } from '../dto/article-tag.dto';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';

@Injectable({ providedIn: 'root' })
export class TagsService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterArticlesTagsDto): Observable<[ITag[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [ITag[], number] }>('tags/paginated', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les tags');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getAllUnpaginated(): Observable<ITag[]> {
    return this.http.get<{ data: ITag[] }>('tags').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les tags');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: ArticleTagDto): Observable<ITag> {
    return this.http.post<{ data: ITag }>('tags', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Tag ajoutée avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de l'ajout du tag");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, payload: { name: string }): Observable<ITag> {
    return this.http.patch<{ data: ITag }>(`tags/id/${id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Tag mise à jour');
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
    return this.http.delete<void>(`tags/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('Tag supprimée avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la suppression du tag');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
