import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { extractApiErrorMessage } from '@shared/helpers';
import { ISector } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { ProgramSectorDto } from '../dto/sectors/program-sector.dto';

@Injectable({ providedIn: 'root' })
export class ProgramSectorsService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(): Observable<ISector[]> {
    return this.http.get<{ data: ISector[] }>('program-sectors').pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les secteurs');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(payload: ProgramSectorDto): Observable<ISector> {
    return this.http.post<{ data: ISector }>('program-sectors', payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Secteur ajouté avec succès');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Échec de l'ajout du secteur");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(id: string, payload: ProgramSectorDto): Observable<ISector> {
    return this.http.patch<{ data: ISector }>(`program-sectors/id/${id}`, payload).pipe(
      map(({ data }) => {
        this.toast.showSuccess('Secteur mis à jour');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la mise à jour du secteur');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`program-sectors/id/${id}`).pipe(
      map(() => {
        this.toast.showSuccess('Secteur supprimé avec succès');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Échec de la suppression du secteur');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
