import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';
import { IArticle, IImage } from '@shared/models';
import { ArticleDto } from '../dto/article.dto';
import { ArticlesService } from '../services/articles.service';

interface IArticlesStore {
  isLoading: boolean;
  articles: [IArticle[], number];
  article: IArticle | null;
  gallery: IImage[];
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
  withMethods((store) => {
    const service = inject(ArticlesService);

    return {
    loadAll: rxMethod<FilterArticlesTagsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (articles) => patchState(store, { isLoading: false, articles }),
              error: () => patchState(store, { isLoading: false, articles: [[], 0] })
            })
          )
        )
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          service.getOne(slug).pipe(
            tap({
              next: (article) => patchState(store, { isLoading: false, article }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    create: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          service.create(payload).pipe(
            tap({
              next: (article) => patchState(store, { isLoading: false, article }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<ArticleDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          service.update(payload).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.articles();
              const updated = list.map((a) => (a.id === data.id ? data : a));
              patchState(store, { isLoading: false, article: data, articles: [updated, count] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.delete(id).pipe(
            tap({
              next: () => {
              const [list, count] = store.articles();
              const filtered = list.filter((a) => a.id !== id);
              patchState(store, { isLoading: false, articles: [filtered, Math.max(0, count - 1)] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.showcase(id).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.articles();
              const updated = list.map((a) => (a.id === data.id ? data : a));
              patchState(store, { isLoading: false, articles: [updated, count], article: data });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    loadGallery: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          service.getGallery(slug).pipe(
            tap({
              next: (gallery) => patchState(store, { isLoading: false, gallery }),
              error: () => patchState(store, { isLoading: false, gallery: [] })
            })
          )
        )
      )
    ),
    deleteImage: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          service.deleteImage(id).pipe(
            tap({
              next: () => {
              const current = store.gallery();
              const filtered = current.filter((img) => img.id !== id);
              patchState(store, { isLoading: false, gallery: filtered });
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    )
  };
  })
);
