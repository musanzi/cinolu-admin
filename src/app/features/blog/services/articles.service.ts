import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IArticle, IImage } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ArticleDto } from '../dto/article.dto';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';

@Injectable({ providedIn: 'root' })
export class ArticlesService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterArticlesTagsDto): Observable<[IArticle[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IArticle[], number] }>('articles', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les articles');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getOne(slug: string): Observable<IArticle> {
    return this.http.get<{ data: IArticle }>(`articles/by-slug/${slug}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Impossible de charger l'article");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: ArticleDto): Observable<IArticle> {
    return this.http.post<{ data: IArticle }>('articles', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess("L'article a été ajouté avec succès");
        this.router.navigate(['/blog/articles']);
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de l'ajout");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(payload: ArticleDto): Observable<IArticle> {
    return this.http.patch<{ data: IArticle }>(`articles/id/${payload.id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess("L'article a été mis à jour avec succès");
        this.router.navigate(['/blog/articles']);
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
    return this.http.delete<void>(`articles/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess("L'article a été supprimé avec succès");
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la suppression");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  showcase(id: string): Observable<IArticle> {
    return this.http.patch<{ data: IArticle }>(`articles/id/${id}/highlight`, {}).pipe(
      map(({ data }) => {
        this.toast.showSuccess(
          data.is_highlighted ? "L'article a été mis en avant" : "L'article n'est plus mis en avant"
        );
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Erreur lors de la mise en avant de l'article");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getGallery(slug: string): Observable<IImage[]> {
    return this.http.get<{ data: IImage[] }>(`articles/by-slug/${slug}/gallery`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Impossible de charger la galerie de l'article");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  deleteImage(id: string): Observable<void> {
    return this.http.delete<void>(`articles/gallery/${id}`).pipe(
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
