import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IResource } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { CreateResourceDto, UpdateResourceDto } from '../dto/resources/create-resource.dto';
import { FilterResourcesDto } from '../dto/resources/filter-resources.dto';

@Injectable({ providedIn: 'root' })
export class ResourcesService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(projectId: string, filters: FilterResourcesDto): Observable<[IResource[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IResource[], number] }>(`resources/project/${projectId}`, { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les ressources');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(dto: CreateResourceDto, file: File): Observable<IResource> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', dto.title);
    formData.append('description', dto.description);
    formData.append('category', dto.category);
    if (dto.project_id) formData.append('project_id', dto.project_id);
    if (dto.phase_id) formData.append('phase_id', dto.phase_id);

    return this.http.post<{ data: IResource }>('resources', formData).pipe(
      map(({ data }) => {
        this.toast.showSuccess('La ressource a été créée avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la création de la ressource");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, dto: UpdateResourceDto): Observable<IResource> {
    return this.http.patch<{ data: IResource }>(`resources/id/${id}`, dto).pipe(
      map(({ data }) => {
        this.toast.showSuccess('La ressource a été mise à jour');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la mise à jour");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  replaceFile(id: string, file: File): Observable<IResource> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.patch<{ data: IResource }>(`resources/file/${id}`, formData).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Le fichier a été remplacé');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors du remplacement du fichier");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`resources/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('La ressource a été supprimée');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la suppression");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
