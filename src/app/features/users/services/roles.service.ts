import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IRole } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterRolesDto } from '../dto/roles/filter-roles.dto';
import { RoleDto } from '../dto/roles/role.dto';

@Injectable({ providedIn: 'root' })
export class RolesService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterRolesDto): Observable<[IRole[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IRole[], number] }>('roles/paginated', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les rôles');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getAllUnpaginated(): Observable<IRole[]> {
    return this.http.get<{ data: IRole[] }>('roles').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les rôles');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: { name: string }): Observable<IRole> {
    return this.http.post<{ data: IRole }>('roles', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Rôle ajouté avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de l'ajout du rôle");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, payload: RoleDto): Observable<IRole> {
    return this.http.patch<{ data: IRole }>(`roles/id/${id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Rôle mis à jour avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors de la mise à jour du rôle');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`roles/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('Rôle supprimé avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la suppression du rôle');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
