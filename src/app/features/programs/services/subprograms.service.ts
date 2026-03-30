import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { extractApiErrorMessage } from '@shared/helpers';
import { ISubprogram } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { SubprogramDto } from '../dto/subprograms/subprogram.dto';

@Injectable({ providedIn: 'root' })
export class SubprogramsService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(programId: string): Observable<ISubprogram[]> {
    return this.http.get<{ data: ISubprogram[] }>(`subprograms/program/${programId}`).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les sous-programmes');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  getAllUnpaginated(): Observable<ISubprogram[]> {
    return this.http.get<{ data: ISubprogram[] }>('subprograms').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les sous-programmes');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: SubprogramDto): Observable<ISubprogram> {
    return this.http.post<{ data: ISubprogram }>('subprograms', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Sous programme ajouté');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de l'ajout du sous programme");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(payload: SubprogramDto): Observable<ISubprogram> {
    return this.http.patch<{ data: ISubprogram }>(`subprograms/id/${payload.id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Sous programme mis à jour');
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
    return this.http.delete<void>(`subprograms/id/${id}`).pipe(
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

  publish(id: string): Observable<ISubprogram> {
    return this.http.patch<{ data: ISubprogram }>(`subprograms/id/${id}/publish`, {}).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors du changement de publication');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  showcase(id: string): Observable<ISubprogram> {
    return this.http.patch<{ data: ISubprogram }>(`subprograms/id/${id}/highlight`, {}).pipe(
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
