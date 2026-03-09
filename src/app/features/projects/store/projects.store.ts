import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, map, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { Project } from '@shared/models';
import { buildQueryParams } from '@shared/helpers';
import { ProjectDto } from '../dto/projects/project.dto';
import { FilterProjectsDto } from '../dto/projects/filter-projects.dto';

interface IProjectsStore {
  isLoading: boolean;
  isImportingCsv: boolean;
  projects: [Project[], number];
  project: Project | null;
}

export const ProjectsStore = signalStore(
  withState<IProjectsStore>({ isLoading: false, isImportingCsv: false, projects: [[], 0], project: null }),
  withProps(() => ({
    http: inject(HttpClient),
    router: inject(Router),
    toast: inject(ToastrService)
  })),
  withMethods(({ http, router, toast, ...store }) => ({
    loadAll: rxMethod<FilterProjectsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((queryParams) => {
          const params = buildQueryParams(queryParams);
          return http.get<{ data: [Project[], number] }>('projects', { params }).pipe(
            map(({ data }) => {
              patchState(store, { isLoading: false, projects: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false, projects: [[], 0] });
              return of(null);
            })
          );
        })
      )
    ),
    loadOne: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((slug) => {
          return http.get<{ data: Project }>(`projects/by-slug/${slug}`).pipe(
            tap(({ data }) => {
              patchState(store, { isLoading: false, project: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    create: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) => {
          return http.post<{ data: Project }>('projects', project).pipe(
            map(({ data }) => {
              toast.showSuccess('Le projet a été ajouté avec succès');
              router.navigate(['/projects']);
              patchState(store, { isLoading: false, project: data });
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de l'ajout du projet");
              patchState(store, { isLoading: false, project: null });
              return of(null);
            })
          );
        })
      )
    ),
    update: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) => {
          return http.patch<{ data: Project }>(`projects/${project.id}`, project).pipe(
            map(({ data }) => {
              toast.showSuccess('Le projet a été mis à jour avec succès');
              router.navigate(['/projects']);
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, project: data, projects: [updated, count] });
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de la mise à jour");
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return http.patch<{ data: Project }>(`projects/${id}/publish`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, projects: [updated, count], project: data });
            }),
            catchError(() => {
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return http.patch<{ data: Project }>(`projects/${id}/highlight`, {}).pipe(
            map(({ data }) => {
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              toast.showSuccess('Projet mis en avant avec succès');
              patchState(store, { isLoading: false, projects: [updated, count], project: data });
            }),
            catchError(() => {
              toast.showError('Erreur lors de la mise en avant du projet');
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return http.delete<{ data: Project }>(`projects/${id}`).pipe(
            tap(() => {
              const [list, count] = store.projects();
              const filtered = list.filter((p) => p.id !== id);
              toast.showSuccess('Le projet a été supprimé avec succès');
              patchState(store, { isLoading: false, projects: [filtered, Math.max(0, count - 1)], project: null });
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de la suppression");
              patchState(store, { isLoading: false });
              return of(null);
            })
          );
        })
      )
    ),
    importParticipantsCsv: rxMethod<{ projectId: string; file: File; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isImportingCsv: true })),
        switchMap(({ projectId, file, onSuccess }) => {
          const formData = new FormData();
          formData.append('file', file);
          return http.post<unknown>(`projects/${projectId}/participants/import-csv`, formData).pipe(
            map(() => {
              toast.showSuccess('Les participants ont été importés avec succès');
              patchState(store, { isImportingCsv: false });
              onSuccess();
            }),
            catchError(() => {
              toast.showError("Une erreur s'est produite lors de l'import des participants");
              patchState(store, { isImportingCsv: false });
              return of(null);
            })
          );
        })
      )
    )
  }))
);
