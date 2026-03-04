import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, of, pipe, switchMap, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { User } from '@shared/models';
import { AuthStore } from '@core/auth/auth.store';
import { SignInDto } from '../dto/sign-in.dto';
import { Router } from '@angular/router';

interface ISignInStore {
  isLoading: boolean;
}

interface ISignInParams {
  payload: SignInDto;
  redirectPath: string;
  onSuccess: () => void;
}

export const SignInStore = signalStore(
  withState<ISignInStore>({
    isLoading: false
  }),
  withProps(() => ({
    http: inject(HttpClient),
    toast: inject(ToastrService),
    router: inject(Router),
    authStore: inject(AuthStore)
  })),
  withMethods(({ http, toast, authStore, router, ...store }) => ({
    signIn: rxMethod<ISignInParams>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, redirectPath, onSuccess }) => {
          return http.post<{ data: User }>('auth/signin', payload).pipe(
            tap(({ data }) => {
              patchState(store, { isLoading: false });
              authStore.setUser(data);
              toast.showSuccess('Connexion réussie');
              router.navigate([redirectPath]);
              onSuccess();
            }),
            catchError((err) => {
              patchState(store, { isLoading: false });
              toast.showError(err.error['message'] || 'Erreur de connexion');
              return of(null);
            })
          );
        })
      )
    )
  }))
);
