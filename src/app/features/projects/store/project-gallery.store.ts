import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { IImage } from '@shared/models';
import { ProjectGalleryService } from '../services/project-gallery.service';

interface IGalleryStore {
  isLoading: boolean;
  gallery: IImage[];
}

export const GalleryStore = signalStore(
  withState<IGalleryStore>({ isLoading: false, gallery: [] }),
  withProps(() => ({
    _projectGalleryService: inject(ProjectGalleryService)
  })),
  withMethods(({ _projectGalleryService, ...store }) => ({
    loadAll: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) =>
          _projectGalleryService.getAll(slug).pipe(
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
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _projectGalleryService.delete(id).pipe(
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
