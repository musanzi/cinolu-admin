import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';
import { IArticle, IImage } from '@shared/models';
import { ArticleDto } from '../dto/article.dto';
import { ArticlesService } from '../services/articles.service';

interface IArticlesStore {
  isLoading: boolean;
  articles: [IArticle[], number];
  article: IArticle | null;
  gallery: IImage[];
}

export const ArticlesStore = signalStore(
  withState<IArticlesStore>({
    isLoading: false,
    articles: [[], 0],
    article: null,
    gallery: []
  }),
  withProps(() => ({
    _articlesService: inject(ArticlesService)
  })),
  withMethods(({ _articlesService, ...store }) => ({
    loadAll: rxMethod<FilterArticlesTagsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _articlesService.getAll(filters).pipe(
            tap({
              next: (articles) => patchState(store, { isLoading: false, articles })
            }),
            catchError(() => {
              patchState(store, { articles: [[], 0] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _articlesService.getOne(slug).pipe(
            tap({
              next: (article) => patchState(store, { isLoading: false, article })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _articlesService.create(payload).pipe(
            tap({
              next: (article) => patchState(store, { isLoading: false, article })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _articlesService.update(payload).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.articles();
                const updated = list.map((a) => (a.id === data.id ? data : a));
                patchState(store, { isLoading: false, article: data, articles: [updated, count] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _articlesService.delete(id).pipe(
            tap({
              next: () => {
                const [list, count] = store.articles();
                const filtered = list.filter((a) => a.id !== id);
                patchState(store, { isLoading: false, articles: [filtered, Math.max(0, count - 1)] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _articlesService.showcase(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.articles();
                const updated = list.map((a) => (a.id === data.id ? data : a));
                patchState(store, { isLoading: false, articles: [updated, count], article: data });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    loadGallery: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _articlesService.getGallery(slug).pipe(
            tap({
              next: (gallery) => patchState(store, { isLoading: false, gallery })
            }),
            catchError(() => {
              patchState(store, { gallery: [] });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    deleteImage: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _articlesService.deleteImage(id).pipe(
            tap({
              next: () => {
                const current = store.gallery();
                const filtered = current.filter((img) => img.id !== id);
                patchState(store, { isLoading: false, gallery: filtered });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    )
  }))
);
