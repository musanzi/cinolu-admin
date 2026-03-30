import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
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
  withMethods((store) => {
    const service = inject(SignInService);

    return {
    signIn: rxMethod<ISignInParams>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap(({ payload, redirectPath, onSuccess }) =>
          service.signIn(payload, redirectPath).pipe(
            tap({
              next: () => {
                patchState(store, { isLoading: false });
                onSuccess();
              },
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    )
  };
  })
);
