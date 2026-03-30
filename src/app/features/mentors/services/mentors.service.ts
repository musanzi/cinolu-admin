import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { IMentorProfile } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { FilterMentorsProfileDto } from '../dto/mentors/filter-mentors-profiles.dto';
import { CreateMentorDto } from '../dto/mentors/create-mentor.dto';

@Injectable({ providedIn: 'root' })
export class MentorsService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);
  private readonly router = inject(Router);

  getAll(filters: FilterMentorsProfileDto): Observable<[IMentorProfile[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [IMentorProfile[], number] }>('mentors/paginated', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les mentors');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getOne(id: string): Observable<IMentorProfile> {
    return this.http.get<{ data: IMentorProfile }>(`mentors/id/${id}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger le mentor');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  searchUsers(term: string): Observable<{ email: string; name: string }[]> {
    return this.http.get<{ data: { email: string; name: string }[] }>('users/search', { params: { term } }).pipe(
      map(({ data }) => (Array.isArray(data) ? data : [])),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de rechercher des utilisateurs');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  approve(id: string): Observable<IMentorProfile> {
    return this.http.patch<{ data: IMentorProfile }>(`mentors/id/${id}/approve`, {}).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Profil mentor approuvé');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Erreur lors de l'approbation");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  reject(id: string): Observable<IMentorProfile> {
    return this.http.patch<{ data: IMentorProfile }>(`mentors/id/${id}/reject`, {}).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Profil mentor rejeté');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors du rejet');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(dto: CreateMentorDto): Observable<IMentorProfile> {
    return this.http.post<{ data: IMentorProfile }>('mentors', dto).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Mentor créé avec succès');
        this.router.navigate(['/mentors']);
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors de la création du mentor');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, dto: CreateMentorDto): Observable<IMentorProfile> {
    return this.http.patch<{ data: IMentorProfile }>(`mentors/applications/${id}`, dto).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Mentor mis à jour avec succès');
        this.router.navigate(['/mentors']);
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors de la mise à jour du mentor');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
