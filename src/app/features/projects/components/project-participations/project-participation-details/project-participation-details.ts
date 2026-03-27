import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArrowLeft, CheckCheck, LucideAngularModule } from 'lucide-angular';
import { ApiImgPipe } from '@shared/pipes';
import { IPhase, IProjectParticipation } from '@shared/models';
import { SelectOption, UiAvatar, UiBadge, UiButton, UiCheckbox, UiInput, UiTextarea, UiSelect } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-project-participation-details',
  templateUrl: './project-participation-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    LucideAngularModule,
    UiAvatar,
    UiBadge,
    UiButton,
    UiCheckbox,
    UiInput,
    UiSelect,
    UiTextarea,
    UiTableSkeleton,
    ApiImgPipe
  ]
})
export class ProjectParticipationDetails {
  participation = input<IProjectParticipation | null>(null);
  isLoading = input(false);
  isSaving = input(false);
  error = input<string | null>(null);
  reviewForm = input.required<FormGroup>();
  reviewPhaseOptions = input.required<SelectOption[]>();
  back = output<void>();
  submitReview = output<void>();
  icons = { ArrowLeft, CheckCheck };
  latestPhase = computed(() => {
    const detail = this.participation();
    if (!detail?.phases.length) return null;
    return [...detail.phases].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
  });

  reviewedPhaseName(): string {
    const phaseId = this.reviewForm().get('phaseId')?.value;
    return this.reviewPhaseOptions().find((option) => option.value === phaseId)?.label ?? 'Aucune phase sélectionnée';
  }

  trackPhase(phase: IPhase): string {
    return phase.id;
  }

  participantLocation(): string {
    const detail = this.participation();
    return [detail?.user.city, detail?.user.country].filter(Boolean).join(', ') || 'Non renseignée';
  }

  reviewerLabel(): string {
    const reviewer = this.participation()?.reviewed_by;
    if (!reviewer) return 'Aucune revue enregistrée';
    return `${reviewer.name} • ${reviewer.email}`;
  }
}
