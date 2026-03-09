import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed } from '@angular/core';
import { catchError, concatMap, map, of, pipe, switchMap, tap } from 'rxjs';
import { buildQueryParams } from '@shared/helpers';
import { INotification, INotificationAttachment } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { NotifyParticipantsDto } from '../dto/notifications/notify-participants.dto';
import { NotificationStatus } from '../types';

export interface FilterProjectNotificationsDto {
  page?: number | null;
  phaseId?: string | null;
  status?: NotificationStatus | null;
}

interface NotificationsStoreState {
  isLoading: boolean;
  isSaving: boolean;
  notifications: [INotification[], number];
  activeNotification: INotification | null;
  error: string | null;
}

export const NotificationsStore = signalStore(
  withState<NotificationsStoreState>({
    isLoading: false,
    isSaving: false,
    notifications: [[], 0],
    activeNotification: null,
    error: null
  }),
  withProps(() => ({
    http: inject(HttpClient),
    toast: inject(ToastrService)
  })),
  withComputed(({ notifications }) => ({
    list: computed(() => notifications()[0]),
    total: computed(() => notifications()[1])
  })),
  withMethods(({ http, toast, ...store }) => {
    const upsertNotification = (notification: INotification): void => {
      const [list, total] = store.notifications();
      const exists = list.some((item) => item.id === notification.id);
      patchState(store, {
        notifications: [
          exists ? list.map((item) => (item.id === notification.id ? notification : item)) : [notification, ...list],
          exists ? total : total + 1
        ],
        activeNotification: notification
      });
    };
    const uploadAttachments = (notification: INotification, attachments: File[]) => {
      if (!attachments.length) {
        return of(notification);
      }
      const formData = new FormData();
      attachments.forEach((file) => formData.append('attachments', file));
      return http
        .post<{ data: INotificationAttachment[] }>(`notifications/${notification.id}/attachments`, formData)
        .pipe(map(({ data }) => ({ ...notification, attachments: data })));
    };
    const fail = (message: string) => {
      patchState(store, { isSaving: false, error: message });
      return of(null);
    };
    return {
      loadAll: rxMethod<{ projectId: string; filters: FilterProjectNotificationsDto }>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(({ projectId, filters }) => {
            const params = buildQueryParams(filters);
            return http.get<{ data: [INotification[], number] }>(`notifications/project/${projectId}`, { params }).pipe(
              tap(({ data }) => {
                const [list] = data;
                const activeId = store.activeNotification()?.id;
                patchState(store, {
                  isLoading: false,
                  notifications: data,
                  activeNotification: activeId ? (list.find((item) => item.id === activeId) ?? null) : null
                });
              }),
              catchError(() => {
                patchState(store, { isLoading: false, notifications: [[], 0], activeNotification: null });
                return of(null);
              })
            );
          })
        )
      ),
      create: rxMethod<{
        projectId: string;
        dto: NotifyParticipantsDto;
        attachments?: File[];
        onSuccess?: (notification: INotification) => void;
      }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ projectId, dto, attachments = [], onSuccess }) =>
            http.post<{ data: INotification }>(`projects/${projectId}/notifications`, dto).pipe(
              map(({ data }) => data),
              concatMap((notification) => uploadAttachments(notification, attachments)),
              tap((notification) => {
                upsertNotification(notification);
                patchState(store, { isSaving: false, error: null });
                toast.showSuccess('La notification a été enregistrée');
                onSuccess?.(notification);
              }),
              catchError(() => fail("Une erreur s'est produite lors de la création de la notification"))
            )
          )
        )
      ),
      update: rxMethod<{
        notificationId: string;
        dto: NotifyParticipantsDto;
        attachments?: File[];
        onSuccess?: (notification: INotification) => void;
      }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ notificationId, dto, attachments = [], onSuccess }) =>
            http.patch<{ data: INotification }>(`notifications/${notificationId}`, dto).pipe(
              map(({ data }) => data),
              concatMap((notification) => uploadAttachments(notification, attachments)),
              tap((notification) => {
                upsertNotification(notification);
                patchState(store, { isSaving: false, error: null });
                toast.showSuccess('La notification a été mise à jour');
                onSuccess?.(notification);
              }),
              catchError(() => fail("Une erreur s'est produite lors de la mise à jour de la notification"))
            )
          )
        )
      ),
      send: rxMethod<{ notificationId: string; onSuccess?: (notification: INotification) => void }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ notificationId, onSuccess }) =>
            http.post<{ data: INotification }>(`projects/notifications/${notificationId}/send`, {}).pipe(
              tap(({ data }) => {
                upsertNotification(data);
                patchState(store, { isSaving: false, error: null });
                toast.showSuccess('La notification a été envoyée');
                onSuccess?.(data);
              }),
              catchError(() => fail("Une erreur s'est produite lors de l'envoi de la notification"))
            )
          )
        )
      ),
      delete: rxMethod<{ notificationId: string }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ notificationId }) =>
            http.delete<void>(`notifications/${notificationId}`).pipe(
              tap(() => {
                const [list, total] = store.notifications();
                patchState(store, {
                  isSaving: false,
                  notifications: [list.filter((item) => item.id !== notificationId), Math.max(0, total - 1)],
                  activeNotification:
                    store.activeNotification()?.id === notificationId ? null : store.activeNotification()
                });
                toast.showSuccess('La notification a été supprimée');
              }),
              catchError(() => fail("Une erreur s'est produite lors de la suppression de la notification"))
            )
          )
        )
      ),
      setActiveNotification(notification: INotification | null): void {
        patchState(store, { activeNotification: notification, error: null });
      },
      clearError(): void {
        patchState(store, { error: null });
      }
    };
  })
);
