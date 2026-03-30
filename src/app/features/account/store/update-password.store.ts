import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { AccountService } from '../services/account.service';

interface IUpdatePasswordStore {
  isLoading: boolean;
}

export const UpdatePasswordStore = signalStore(
  withState<IUpdatePasswordStore>({ isLoading: false }),
  withMethods((store) => {
    const service = inject(AccountService);

    return {
    updatePassword: rxMethod<UpdatePasswordDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          service.updatePassword(payload).pipe(
            tap({
              next: () => patchState(store, { isLoading: false }),
              error: () => patchState(store, { isLoading: false })
            })
          )
        )
      )
    )
  };
  })
);
