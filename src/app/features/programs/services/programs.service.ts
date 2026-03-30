import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { Program } from '@shared/models';
import { ToastrService } from '@shared/services/toast';
import { FilterProgramsDto } from '../dto/programs/filter-programs.dto';
import { ProgramDto } from '../dto/programs/program.dto';

@Injectable({ providedIn: 'root' })
export class ProgramsService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastrService);

  getAll(filters: FilterProgramsDto): Observable<[Program[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [Program[], number] }>('programs/paginated', { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les programmes');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getAllUnpaginated(): Observable<Program[]> {
    return this.http.get<{ data: Program[] }>('programs').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les programmes');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getOne(slug: string): Observable<Program> {
    return this.http.get<{ data: Program }>(`programs/by-slug/${slug}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger le programme');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: ProgramDto): Observable<void> {
    return this.http.post('programs', payload).pipe(
      map(() => {
        this.router.navigate(['/programs']);
        this.toast.showSuccess('Programme ajouté');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de l'ajout du rôle");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(programId: string, payload: ProgramDto): Observable<Program> {
    return this.http.patch<{ data: Program }>(`programs/id/${programId}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Programme mis à jour');
        this.router.navigate(['/programs']);
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la mise à jour');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`programs/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('Programme supprimé');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la suppression');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  publish(id: string): Observable<Program> {
    return this.http.patch<{ data: Program }>(`programs/id/${id}/publish`, {}).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors du changement de publication');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  highlight(id: string): Observable<Program> {
    return this.http.patch<{ data: Program }>(`programs/id/${id}/highlight`, {}).pipe(
      map(({ data }) => {
        this.toast.showSuccess(
          data.is_highlighted ? 'Programme mis en avant' : 'Programme retiré de la mise en avant'
        );
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors de la mise en avant du programme');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
