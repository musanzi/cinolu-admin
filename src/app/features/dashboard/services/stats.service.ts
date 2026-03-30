import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import type { IGeneralStats, IStatsByYear } from '../types/stats.type';

@Injectable({ providedIn: 'root' })
export class StatsService {
  private readonly http = inject(HttpClient);

  getGeneral(): Observable<IGeneralStats> {
    return this.http.get<{ data: IGeneralStats } | IGeneralStats>('stats/admin/overview').pipe(
      map((response) => ('data' in response ? response.data : response)),
      catchError(() => throwError(() => 'Impossible de charger les statistiques générales'))
    );
  }

  getByYear(year: number): Observable<IStatsByYear> {
    return this.http.get<{ data: IStatsByYear } | IStatsByYear>(`stats/admin/year/${year}`).pipe(
      map((response) => ('data' in response ? response.data : response)),
      catchError(() => throwError(() => 'Impossible de charger les statistiques annuelles'))
    );
  }
}
