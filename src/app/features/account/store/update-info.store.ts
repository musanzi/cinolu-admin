import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { UpdateInfoDto } from '../dto/update-info.dto';
import { AccountService } from '../services/account.service';

interface IUpdateInfoStore {
  isLoading: boolean;
}

export const UpdateInfoStore = signalStore(
  withState<IUpdateInfoStore>({ isLoading: false }),
  withProps(() => ({
    _accountService: inject(AccountService)
  })),
  withMethods(({ _accountService, ...store }) => ({
    updateInfo: rxMethod<UpdateInfoDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          _accountService.updateInfo(payload).pipe(
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
