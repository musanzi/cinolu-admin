import { inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { computed } from '@angular/core';
import { catchError, EMPTY, finalize, pipe, switchMap, tap } from 'rxjs';
import { INotification } from '@shared/models';
import { NotifyParticipantsDto } from '../dto/notifications/notify-participants.dto';
import { FilterProjectNotificationsDto, NotificationsService } from '../services/notifications.service';

export type { FilterProjectNotificationsDto } from '../services/notifications.service';

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
  withComputed(({ notifications }) => ({
    list: computed(() => notifications()[0]),
    total: computed(() => notifications()[1])
  })),
  withProps(() => ({
    _notificationsService: inject(NotificationsService)
  })),
  withMethods(({ _notificationsService, ...store }) => {
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
    return {
      loadAll: rxMethod<{ projectId: string; filters: FilterProjectNotificationsDto }>(
        pipe(
          tap(() => patchState(store, { isLoading: true })),
          switchMap(({ projectId, filters }) =>
            _notificationsService.getAll(projectId, filters).pipe(
              tap({
                next: (notifications) => {
                  const [list] = notifications;
                  const activeId = store.activeNotification()?.id;
                  patchState(store, {
                    isLoading: false,
                    notifications,
                    activeNotification: activeId ? (list.find((item) => item.id === activeId) ?? null) : null
                  });
                }
              }),
              catchError(() => {
                patchState(store, { notifications: [[], 0], activeNotification: null });
                return EMPTY;
              }),
              finalize(() => patchState(store, { isLoading: false }))
            )
          )
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
            _notificationsService.create(projectId, dto, attachments).pipe(
              tap({
                next: (notification) => {
                  upsertNotification(notification);
                  patchState(store, { isSaving: false, error: null });
                  onSuccess?.(notification);
                }
              }),
              catchError((error) => {
                patchState(store, { error: String(error) });
                return EMPTY;
              }),
              finalize(() => patchState(store, { isSaving: false }))
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
            _notificationsService.update(notificationId, dto, attachments).pipe(
              tap({
                next: (notification) => {
                  upsertNotification(notification);
                  patchState(store, { isSaving: false, error: null });
                  onSuccess?.(notification);
                }
              }),
              catchError((error) => {
                patchState(store, { error: String(error) });
                return EMPTY;
              }),
              finalize(() => patchState(store, { isSaving: false }))
            )
          )
        )
      ),
      send: rxMethod<{ notificationId: string; onSuccess?: (notification: INotification) => void }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ notificationId, onSuccess }) =>
            _notificationsService.send(notificationId).pipe(
              tap({
                next: (notification) => {
                  upsertNotification(notification);
                  patchState(store, { isSaving: false, error: null });
                  onSuccess?.(notification);
                }
              }),
              catchError((error) => {
                patchState(store, { error: String(error) });
                return EMPTY;
              }),
              finalize(() => patchState(store, { isSaving: false }))
            )
          )
        )
      ),
      delete: rxMethod<{ notificationId: string }>(
        pipe(
          tap(() => patchState(store, { isSaving: true, error: null })),
          switchMap(({ notificationId }) =>
            _notificationsService.delete(notificationId).pipe(
              tap({
                next: () => {
                  const [list, total] = store.notifications();
                  patchState(store, {
                    isSaving: false,
                    notifications: [list.filter((item) => item.id !== notificationId), Math.max(0, total - 1)],
                    activeNotification:
                      store.activeNotification()?.id === notificationId ? null : store.activeNotification()
                  });
                }
              }),
              catchError((error) => {
                patchState(store, { error: String(error) });
                return EMPTY;
              }),
              finalize(() => patchState(store, { isSaving: false }))
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
