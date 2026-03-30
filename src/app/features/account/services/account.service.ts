import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { extractApiErrorMessage } from '@shared/helpers';
import { IUser } from '@shared/models/user.model';
import { ToastrService } from '@shared/services/toast';
import { UpdateInfoDto } from '../dto/update-info.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';

@Injectable({ providedIn: 'root' })
export class AccountService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStore);
  private readonly toast = inject(ToastrService);

  updateInfo(payload: UpdateInfoDto): Observable<IUser> {
    return this.http.patch<{ data: IUser }>('auth/me', payload).pipe(
      map(({ data }) => {
        this.authStore.setUser(data);
        this.toast.showSuccess('Profil mis à jour');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors de la mise à jour');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  updatePassword(payload: UpdatePasswordDto): Observable<void> {
    return this.http.patch<{ data: IUser }>('auth/me/password', payload).pipe(
      map(() => {
        this.toast.showSuccess('Mot de passe mis à jour');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur lors de la mise à jour');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
