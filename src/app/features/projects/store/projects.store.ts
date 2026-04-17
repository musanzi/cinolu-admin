import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { IProject } from '@shared/models';
import { ProjectDto } from '../dto/projects/project.dto';
import { FilterProjectsDto } from '../dto/projects/filter-projects.dto';
import { ProjectsService } from '../services/projects.service';

interface IProjectsStore {
  isLoading: boolean;
  isImportingCsv: boolean;
  projects: [IProject[], number];
  project: IProject | null;
}

export const ProjectsStore = signalStore(
  withState<IProjectsStore>({ isLoading: false, isImportingCsv: false, projects: [[], 0], project: null }),
  withProps(() => ({
    _projectsService: inject(ProjectsService)
  })),
  withMethods(({ _projectsService, ...store }) => ({
    loadAll: rxMethod<FilterProjectsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          _projectsService.getAll(filters).pipe(
            tap({
              next: (projects) => patchState(store, { isLoading: false, projects })
            }),
            catchError(() => {
              patchState(store, { projects: [[], 0] });
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
          _projectsService.getOne(slug).pipe(
            tap({
              next: (project) => patchState(store, { isLoading: false, project })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    create: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) =>
          _projectsService.create(project).pipe(
            tap({
              next: (data) => patchState(store, { isLoading: false, project: data })
            }),
            catchError(() => {
              patchState(store, { project: null });
              return EMPTY;
            }),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    update: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) =>
          _projectsService.update(project).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.projects();
                const updated = list.map((p) => (p.id === data.id ? data : p));
                patchState(store, { isLoading: false, project: data, projects: [updated, count] });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) =>
          _projectsService.publish(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.projects();
                const updated = list.map((p) => (p.id === data.id ? data : p));
                patchState(store, { isLoading: false, projects: [updated, count], project: data });
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
          _projectsService.showcase(id).pipe(
            tap({
              next: (data) => {
                const [list, count] = store.projects();
                const updated = list.map((p) => (p.id === data.id ? data : p));
                patchState(store, { isLoading: false, projects: [updated, count], project: data });
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
          _projectsService.delete(id).pipe(
            tap({
              next: () => {
                const [list, count] = store.projects();
                const filtered = list.filter((p) => p.id !== id);
                patchState(store, { isLoading: false, projects: [filtered, Math.max(0, count - 1)], project: null });
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    ),
    importParticipantsCsv: rxMethod<{ projectId: string; file: File; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isImportingCsv: true })),
        switchMap(({ projectId, file, onSuccess }) =>
          _projectsService.importParticipantsCsv(projectId, file).pipe(
            tap({
              next: () => {
                patchState(store, { isImportingCsv: false });
                onSuccess();
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isImportingCsv: false }))
          )
        )
      )
    )
  }))
);
