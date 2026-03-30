import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { IImage } from '@shared/models';
import { EventGalleryService } from '../services/event-gallery.service';

interface IGalleryStore {
  isLoading: boolean;
  gallery: IImage[];
}

export const GalleryStore = signalStore(
  withState<IGalleryStore>({ isLoading: false, gallery: [] }),
  withMethods((store) => {
    const service = inject(EventGalleryService);

    return {
    loadAll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          service.getAll(slug).pipe(
            tap({
              next: (gallery) => patchState(store, { isLoading: false, gallery }),
              error: () => patchState(store, { isLoading: false, gallery: [] })
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
