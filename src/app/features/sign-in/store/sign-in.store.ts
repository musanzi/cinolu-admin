import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { SignInDto } from '../dto/sign-in.dto';
import { SignInService } from '../services/sign-in.service';

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
    _signInService: inject(SignInService)
  })),
  withMethods(({ _signInService, ...store }) => ({
    signIn: rxMethod<ISignInParams>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, redirectPath, onSuccess }) =>
          _signInService.signIn(payload, redirectPath).pipe(
            tap({
              next: () => {
                patchState(store, { isLoading: false });
                onSuccess();
              }
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    )
  }))
);
