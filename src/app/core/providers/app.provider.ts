import {
  EnvironmentProviders,
  inject,
  provideAppInitializer,
  provideEnvironmentInitializer,
  Provider
} from '@angular/core';
import { appConfig } from '../../app.config';
import { HttpClient } from '@angular/common/http';
import { catchError, map, of } from 'rxjs';
import { AuthStore } from '../auth/auth.store';
import { User } from '@shared/models';
import { APP_CONFIG } from '@shared/services/config';
import { NavigationLoadingService } from '@shared/services/loading/navigation.service';

export const provideApp = (): EnvironmentProviders[] => {
  const providers: Provider | EnvironmentProviders = [
    { provide: APP_CONFIG, useValue: appConfig || {} },
    provideEnvironmentInitializer(() => inject(NavigationLoadingService)),
    provideAppInitializer(() => {
      const authStore = inject(AuthStore);
      const http = inject(HttpClient);
      authStore.setCheckingAuth(true);
      return http.get<{ data: User }>('auth/me').pipe(
        map(({ data }) => {
          authStore.setUser(data);
          authStore.setCheckingAuth(false);
        }),
        catchError(() => {
          authStore.setUser(null);
          authStore.setCheckingAuth(false);
          return of(null);
        })
      );
    })
  ];
  return providers;
};
