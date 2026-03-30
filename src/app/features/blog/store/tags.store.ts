import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { exhaustMap, pipe, switchMap, tap } from 'rxjs';
import { FilterArticlesTagsDto } from '../dto/filter-tags.dto';
import { ITag } from '@shared/models';
import { ArticleTagDto } from '../dto/article-tag.dto';
import { TagsService } from '../services/tags.service';

interface ITagsStore {
  isLoading: boolean;
  tags: [ITag[], number];
  allTags: ITag[];
  lastQuery: FilterArticlesTagsDto | null;
}

export const TagsStore = signalStore(
  withState<ITagsStore>({ isLoading: false, allTags: [], tags: [[], 0], lastQuery: null }),
  withMethods((store) => {
    const service = inject(TagsService);

    return {
    loadUpaginated: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() =>
          service.getAllUnpaginated().pipe(
            tap({
              next: (allTags) => patchState(store, { isLoading: false, allTags }),
              error: () => patchState(store, { isLoading: false, allTags: [] })
            })
          )
        )
      )
    ),
    loadAll: rxMethod<FilterArticlesTagsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          patchState(store, { lastQuery: queryParams });
          return service.getAll(queryParams).pipe(
            tap({
              next: (tags) => patchState(store, { isLoading: false, tags }),
              error: () => patchState(store, { isLoading: false, tags: [[], 0] })
            })
          );
        })
      )
    ),
    create: rxMethod<{ payload: ArticleTagDto; onSuccess: (tag: ITag) => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, onSuccess }) =>
          service.create(payload).pipe(
            tap({
              next: (data) => {
              const [tags, count] = store.tags();
              const allTags = store.allTags();
              const hasTag = allTags.some((tag) => tag.id === data.id);
              patchState(store, {
                tags: [[data, ...tags], count + 1],
                allTags: hasTag ? allTags : [data, ...allTags]
              });
              patchState(store, { isLoading: false });
              onSuccess(data);
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    update: rxMethod<{ id: string; payload: { name: string }; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id, payload, onSuccess }) =>
          service.update(id, payload).pipe(
            tap({
              next: (data) => {
              const [tags, count] = store.tags();
              const updated = tags.map((t) => (t.id === data.id ? data : t));
              patchState(store, { tags: [updated, count] });
              patchState(store, { isLoading: false });
              onSuccess();
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    delete: rxMethod<{ id: string }>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ id }) =>
          service.delete(id).pipe(
            tap({
              next: () => {
              const [tags, count] = store.tags();
              const filtered = tags.filter((tag) => tag.id !== id);
              patchState(store, { tags: [filtered, count - 1] });
              patchState(store, { isLoading: false });
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
