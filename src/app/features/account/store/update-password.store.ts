import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { AccountService } from '../services/account.service';

interface IUpdatePasswordStore {
  isLoading: boolean;
}

export const UpdatePasswordStore = signalStore(
  withState<IUpdatePasswordStore>({ isLoading: false }),
  withProps(() => ({
    _accountService: inject(AccountService)
  })),
  withMethods(({ _accountService, ...store }) => ({
    updatePassword: rxMethod<UpdatePasswordDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _accountService.updatePassword(payload).pipe(
            tap({
              next: () => patchState(store, { isLoading: false })
            }),
            catchError(() => EMPTY),
            finalize(() => patchState(store, { isLoading: false }))
          )
        )
      )
    )
  }))
);
