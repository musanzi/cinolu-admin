import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, map, Observable, throwError } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { extractApiErrorMessage } from '@shared/helpers';
import { IUser } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { SignInDto } from '../dto/sign-in.dto';

@Injectable({ providedIn: 'root' })
export class SignInService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly authStore = inject(AuthStore);

  signIn(payload: SignInDto, redirectPath: string): Observable<IUser> {
    return this.http.post<{ data: IUser }>('auth/signin', payload).pipe(
      map(({ data }) => {
        this.authStore.setUser(data);
        this.toast.showSuccess('Connexion réussie');
        this.router.navigate([redirectPath]);
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Erreur de connexion');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }
}
