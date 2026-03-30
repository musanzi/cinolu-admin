import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, concatMap, map, Observable, of, throwError } from 'rxjs';
import { buildQueryParams, extractApiErrorMessage } from '@shared/helpers';
import { INotification, INotificationAttachment } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { NotifyParticipantsDto } from '../dto/notifications/notify-participants.dto';
import { NotificationStatus } from '../types';

export interface FilterProjectNotificationsDto {
  page?: number | null;
  phaseId?: string | null;
  status?: NotificationStatus | null;
}

@Injectable({ providedIn: 'root' })
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly toast = inject(ToastrService);

  getAll(projectId: string, filters: FilterProjectNotificationsDto): Observable<[INotification[], number]> {
    const params = buildQueryParams(filters);

    return this.http.get<{ data: [INotification[], number] }>(`notifications/project/${projectId}`, { params }).pipe(
      map(({ data }) => data),
      catchError((error) => {
        const message = extractApiErrorMessage(error, 'Impossible de charger les notifications');
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  create(projectId: string, dto: NotifyParticipantsDto, attachments: File[] = []): Observable<INotification> {
    return this.http.post<{ data: INotification }>(`projects/id/${projectId}/notifications`, dto).pipe(
      map(({ data }) => data),
      concatMap((notification) => this.uploadAttachments(notification, attachments)),
      map((notification) => {
        this.toast.showSuccess('La notification a été enregistrée');
        return notification;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la création de la notification");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  update(notificationId: string, dto: NotifyParticipantsDto, attachments: File[] = []): Observable<INotification> {
    return this.http.patch<{ data: INotification }>(`notifications/id/${notificationId}`, dto).pipe(
      map(({ data }) => data),
      concatMap((notification) => this.uploadAttachments(notification, attachments)),
      map((notification) => {
        this.toast.showSuccess('La notification a été mise à jour');
        return notification;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la mise à jour de la notification");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  send(notificationId: string): Observable<INotification> {
    return this.http.post<{ data: INotification }>(`projects/notifications/${notificationId}/send`, {}).pipe(
      map(({ data }) => {
        this.toast.showSuccess('La notification a été envoyée');
        return data;
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de l'envoi de la notification");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  delete(notificationId: string): Observable<void> {
    return this.http.delete<void>(`notifications/id/${notificationId}`).pipe(
      map(() => {
        this.toast.showSuccess('La notification a été supprimée');
      }),
      catchError((error) => {
        const message = extractApiErrorMessage(error, "Une erreur s'est produite lors de la suppression de la notification");
        this.toast.showError(message);
        return throwError(() => message);
      })
    );
  }

  private uploadAttachments(notification: INotification, attachments: File[]): Observable<INotification> {
    if (!attachments.length) {
      return of(notification);
    }

    const formData = new FormData();
    attachments.forEach((file) => formData.append('attachments', file));

    return this.http
      .post<{ data: INotificationAttachment[] }>(`notifications/id/${notification.id}/attachments`, formData)
      .pipe(map(({ data }) => ({ ...notification, attachments: data })));
  }
}
