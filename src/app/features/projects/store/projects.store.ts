import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
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
  withMethods((store) => {
    const service = inject(ProjectsService);

    return {
    loadAll: rxMethod<FilterProjectsDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((filters) =>
          service.getAll(filters).pipe(
            tap({
              next: (projects) => patchState(store, { isLoading: false, projects }),
              error: () => patchState(store, { isLoading: false, projects: [[], 0] })
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
              next: (project) => patchState(store, { isLoading: false, project }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    ),
    create: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) => {
          return service.create(project).pipe(
            tap({
              next: (data) => patchState(store, { isLoading: false, project: data }),
              error: () => patchState(store, { isLoading: false, project: null })
            })
          );
        })
      )
    ),
    update: rxMethod<ProjectDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((project) => {
          return service.update(project).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, project: data, projects: [updated, count] });
              },
              error: () => patchState(store, { isLoading: false })
            })
          );
        })
      )
    ),
    publish: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return service.publish(id).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, projects: [updated, count], project: data });
              },
              error: () => patchState(store, { isLoading: false })
            })
          );
        })
      )
    ),
    showcase: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return service.showcase(id).pipe(
            tap({
              next: (data) => {
              const [list, count] = store.projects();
              const updated = list.map((p) => (p.id === data.id ? data : p));
              patchState(store, { isLoading: false, projects: [updated, count], project: data });
              },
              error: () => patchState(store, { isLoading: false })
            })
          );
        })
      )
    ),
    delete: rxMethod<string>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((id) => {
          return service.delete(id).pipe(
            tap({
              next: () => {
              const [list, count] = store.projects();
              const filtered = list.filter((p) => p.id !== id);
              patchState(store, { isLoading: false, projects: [filtered, Math.max(0, count - 1)], project: null });
              },
              error: () => patchState(store, { isLoading: false })
            })
          );
        })
      )
    ),
    importParticipantsCsv: rxMethod<{ projectId: string; file: File; onSuccess: () => void }>(
      pipe(
        tap(() => patchState(store, { isImportingCsv: true })),
        switchMap(({ projectId, file, onSuccess }) => {
          return service.importParticipantsCsv(projectId, file).pipe(
            tap({
              next: () => {
                patchState(store, { isImportingCsv: false });
                onSuccess();
              },
              error: () => patchState(store, { isImportingCsv: false })
            })
          );
        })
      )
    )
  };
  })
);
