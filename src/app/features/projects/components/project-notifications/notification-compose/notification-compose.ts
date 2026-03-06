import { ChangeDetectionStrategy, Component, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { AttachmentPreview } from '@features/projects/types/attachments.type';
import { UiButton, UiCheckbox, UiInput, UiSelect, UiTextEditor } from '@shared/ui';
import { CircleAlert, LucideAngularModule, Paperclip, Send, X } from 'lucide-angular';
import { buildImpactReportTemplate } from '../report-template';
import { NotificationState, SubmitNotification } from '@features/projects/types/notifications.types';

@Component({
  selector: 'app-notification-compose',
  templateUrl: './notification-compose.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    UiButton,
    UiCheckbox,
    UiInput,
    UiSelect,
    UiTextEditor,
    LucideAngularModule
  ]
})
export class NotificationCompose {
  state = input.required<NotificationState>();
  saveDraft = output<SubmitNotification>();
  sendNotification = output<SubmitNotification>();
  notifyMentors = signal<boolean>(false);
  notifyStaff = signal<boolean>(false);
  phaseId = signal<string | null>(null);
  form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    body: ['', [Validators.required, Validators.minLength(10)]]
  });
  attachments = signal<AttachmentPreview[]>([]);
  actionLoading = signal<'save' | 'send' | null>(null);
  icons = { CircleAlert, Paperclip, Send, X };

  constructor() {
    effect(() => {
      const notification = this.state().activeNotification;
      if (notification) {
        this.phaseId.set(notification.phase?.id || null);
        this.notifyMentors.set(notification.notify_mentors);
        this.form.patchValue({
          title: notification.title,
          body: notification.body
        });
      } else if (this.notifyStaff()) {
        const projectName = this.state().project.name;
        this.form.patchValue({
          title: `Rapport d'activité ${projectName}`,
          body: this.#impactReportTemplate()
        });
      } else {
        this.form.reset();
        this.phaseId.set(null);
        this.attachments.set([]);
      }
    });
  }

  submitForm(action: 'save' | 'send'): void {
    if (!this.form.invalid) return;
    this.actionLoading.set(action);
    const emiter = action === 'save' ? this.saveDraft : this.sendNotification;
    emiter.emit({
      dto: {
        ...this.form.getRawValue(),
        phase_id: this.phaseId(),
        notify_mentors: this.notifyMentors(),
        notify_staff: this.notifyStaff()
      },
      attachments: this.attachments().map((a) => a.file)
    });
  }

  onSelectFiles(event: Event): void {
    const files = Array.from((event.target as HTMLInputElement).files ?? []);
    if (!files.length) return;
    const currentIds = new Set(this.attachments().map((a) => a.id));
    const newAttachments = files.map((file, i) => ({ file, id: `${i++}` })).filter((item) => !currentIds.has(item.id));
    this.attachments.update((current) => [...current, ...newAttachments]);
    (event.target as HTMLInputElement).value = '';
  }

  onRemoveAttachment(id: string): void {
    this.attachments.update((items) => items.filter((item) => item.id !== id));
  }

  onClearAttachments(): void {
    this.attachments.set([]);
  }

  attachmentUrl(filename: string): string {
    return `${environment.apiUrl}uploads/notifications/${filename}`;
  }

  #impactReportTemplate(): string {
    return buildImpactReportTemplate(this.state().project);
  }
}
