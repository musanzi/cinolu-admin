import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';
import { buildQueryParams } from '@shared/helpers';
import { Article, Image } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ArticleDto } from '../dto/article.dto';

interface IArticlesStore {
  isLoading: boolean;
  articles: [Article[], number];
  article: Article | null;
  gallery: Image[];
  isLoadingTags: boolean;
}

export const ArticlesStore = signalStore(
  withState<IArticlesStore>({
    isLoading: false,
    articles: [[], 0],
    article: null,
    gallery: [],
    isLoadingTags: false
  }),
  withProps(() => ({
    http: inject(HttpClient),
    router: inject(Router),
    toast: inject(ToastrService)
  })),
  withMethods(({ http, router, toast, ...store }) => ({
    loadAll: rxMethod<FilterArticlesTagsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return http.get<{ data: [Article[], number] }>('articles', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, articles: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, articles: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          http.get<{ data: Article }>(`articles/by-slug/${slug}`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, article: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    create: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          http.post<{ data: Article }>('articles', payload).pipe(
            map(({ data }) => {
              toast.showSuccess("L'article a été ajouté avec succès");
              router.navigate(['/blog/articles']);
              patchState(store, { isLoading: false, article: data });
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de l'ajout");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    update: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          http.patch<{ data: Article }>(`articles/${payload.id}`, payload).pipe(
            map(({ data }) => {
              toast.showSuccess("L'article a été mis à jour avec succès");
              router.navigate(['/blog/articles']);
              const [list, count] = store.articles();
              const updated = list.map((a) => (a.id === data.id ? data : a));
              patchState(store, { isLoading: false, article: data, articles: [updated, count] });
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de la mise à jour");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          http.delete<void>(`articles/${id}`).pipe(
            map(() => {
              const [list, count] = store.articles();
              const filtered = list.filter((a) => a.id !== id);
              toast.showSuccess("L'article a été supprimé avec succès");
              patchState(store, { isLoading: false, articles: [filtered, Math.max(0, count - 1)] });
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de la suppression");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          http.patch<{ data: Article }>(`articles/${id}/highlight`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.articles();
              const updated = list.map((a) => (a.id === data.id ? data : a));
              toast.showSuccess(
                data.is_highlighted ? "L'article a été mis en avant" : "L'article n'est plus mis en avant"
              );
              patchState(store, { isLoading: false, articles: [updated, count], article: data });
            }),
            catchError(() => {
              toast.showError("Erreur lors de la mise en avant de l'article");
              patchState(store, { isLoading: false });
              return of(null);
            })
          )
        )
      )
    ),
    loadGallery: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          http.get<{ data: Image[] }>(`articles/by-slug/${slug}/gallery`).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, gallery: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, gallery: [] });
              return of(null);
            })
          )
        )
      )
    ),
    deleteImage: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          http.delete<void>(`articles/gallery/${id}`).pipe(
            map(() => {
              const current = store.gallery();
              const filtered = current.filter((img) => img.id !== id);
              patchState(store, { isLoading: false, gallery: filtered });
              toast.showSuccess('Image supprimée avec succès');
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              toast.showError("Échec de la suppression de l'image");
              return of(null);
            })
          )
        )
      )
    )
  }))
);
