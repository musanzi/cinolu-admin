import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { inject } from '@angular/core';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { UpdateInfoDto } from '../dto/update-info.dto';
import { AccountService } from '../services/account.service';

interface IUpdateInfoStore {
  isLoading: boolean;
}

export const UpdateInfoStore = signalStore(
  withState<IUpdateInfoStore>({ isLoading: false }),
  withMethods((store) => {
    const service = inject(AccountService);

    return {
    updateInfo: rxMethod<UpdateInfoDto>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        switchMap((payload) =>
          service.updateInfo(payload).pipe(
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
