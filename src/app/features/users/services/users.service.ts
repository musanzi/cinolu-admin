import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IUser } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { UserDto } from '../dto/users/user.dto';
import { FilterUsersDto } from '../dto/users/filter-users.dto';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);
  private readonly router = inject(Router);

  getAll(filters: FilterUsersDto): Observable<[IUser[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IUser[], number] }>('users', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les utilisateurs');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getStaff(): Observable<IUser[]> {
    return this.http.get<{ data: IUser[] }>('users/staff').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Impossible de charger l'équipe");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getOne(email: string): Observable<IUser> {
    return this.http.get<{ data: IUser }>(`users/by-email/${email}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Impossible de charger l'utilisateur");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(dto: UserDto): Observable<IUser> {
    return this.http.post<{ data: IUser }>('users', dto).pipe(
      map(({ data }) => {
        this.router.navigate(['/users']);
        this.toast.showSuccess('Utilisateur ajouté avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Erreur lors de l'ajout de l'utilisateur");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, dto: UserDto): Observable<IUser> {
    return this.http.patch<{ data: IUser }>(`users/id/${id}`, dto).pipe(
      map(({ data }) => {
        this.router.navigate(['/users']);
        this.toast.showSuccess('Utilisateur mis à jour avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Erreur lors de la mise à jour de l'utilisateur");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(userId: string): Observable<void> {
    return this.http.delete<void>(`users/id/${userId}`).pipe(
      map(() => {
        this.toast.showSuccess('Utilisateur supprimé avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de la suppression de l'utilisateur");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  clearInvalidUsers(): Observable<void> {
    return this.http.delete<void>('users/clear').pipe(
      map(() => {
        this.toast.showSuccess('Utilisateurs invalides supprimés avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la suppression des utilisateurs invalides');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  download(filters: FilterUsersDto): Observable<Blob> {
    const params = buildQueryParams(filters);

    return this.http.get('users/export/users.csv', { params, responseType: 'blob' }).pipe(
      map((blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'users.csv';
        anchor.click();
        window.URL.revokeObjectURL(url);
        return blob;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de télécharger les utilisateurs');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  importCsv(file: File): Observable<void> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<unknown>('users/import-csv', formData).pipe(
      map(() => {
        this.toast.showSuccess('Utilisateurs importés avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de l'import des utilisateurs");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
