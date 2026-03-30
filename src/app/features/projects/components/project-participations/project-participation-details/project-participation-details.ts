import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  OnDestroy,
  output,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArrowLeft, CheckCheck, PencilLine, X, LucideAngularModule } from 'lucide-angular';
import { ParticipationsStore } from '@features/projects/store/participations.store';
import { ApiImgPipe } from '@shared/pipes';
import { IPhase, IProjectParticipation, IProjectParticipationReview } from '@shared/models';
import { SelectOption, UiAvatar, UiBadge, UiButton, UiCheckbox, UiInput, UiSelect, UiTextarea } from '@shared/ui';
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
export class ProjectParticipationDetails implements OnDestroy {
  participationId = input.required<string>();
  #fb = inject(FormBuilder);
  store = inject(ParticipationsStore);
  back = output<void>();
  selectedReviewId = signal<string | null>(null);
  icons = { ArrowLeft, CheckCheck, PencilLine, X };
  reviewForm = this.#fb.group({
    phaseId: ['', Validators.required],
    score: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    message: [''],
    notifyParticipant: [false]
  });
  participation = computed<IProjectParticipation | null>(() => this.store.participation());
  isLoading = computed(() => this.store.isDetailLoading());
  isSaving = computed(() => this.store.isSaving());
  error = computed(() => this.store.error());
  sortedReviews = computed<IProjectParticipationReview[]>(() => {
    const reviews = this.participation()?.reviews ?? [];
    return [...reviews].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  });
  selectedReview = computed<IProjectParticipationReview | null>(() => {
    const reviewId = this.selectedReviewId();
    if (!reviewId) return null;
    return this.sortedReviews().find((review) => review.id === reviewId) ?? null;
  });
  latestPhase = computed(() => {
    const detail = this.participation();
    if (!detail?.phases.length) return null;
    return [...detail.phases].sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())[0];
  });
  reviewPhaseOptions = computed<SelectOption[]>(() => {
    const detail = this.participation();
    if (!detail) return [];
    return [...detail.phases]
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime())
      .map((phase) => ({ label: phase.name, value: phase.id }));
  });
  reviewCount = computed(() => this.sortedReviews().length);
  latestReview = computed(() => this.sortedReviews()[0] ?? null);
  isEditingReview = computed(() => !!this.selectedReview());

  constructor() {
    effect(() => {
      this.store.loadOne(this.participationId());
    });

    effect(() => {
      const participation = this.participation();
      if (!participation) return;

      const selectedReview = this.selectedReview();

      if (selectedReview) {
        this.reviewForm.controls.phaseId.disable({ emitEvent: false });
        this.reviewForm.patchValue({
          phaseId: selectedReview.phase.id,
          score: String(selectedReview.score),
          message: selectedReview.message ?? '',
          notifyParticipant: false
        });
        return;
      }

      this.resetReviewForm(false);
    });

    effect(() => {
      if (!this.store.isSaving() && !this.store.error()) {
        this.selectedReviewId.set(null);
        this.store.loadOne(this.participationId());
      }
    });
  }

  ngOnDestroy(): void {
    this.store.clearParticipation();
  }

  trackPhase(phase: IPhase): string {
    return phase.id;
  }

  trackReview(review: IProjectParticipationReview): string {
    return review.id;
  }

  participantLocation(): string {
    const detail = this.participation();
    return [detail?.user.city, detail?.user.country].filter(Boolean).join(', ') || 'Non renseignée';
  }

  reviewPhaseName(review: IProjectParticipationReview): string {
    return review.phase?.name || 'Phase non renseignée';
  }

  reviewAuthor(review: IProjectParticipationReview): string {
    return `${review?.reviewer?.name} • ${review?.reviewer?.email}`;
  }

  reviewScoreVariant(score: number): 'success' | 'warning' | 'danger' {
    if (score >= 75) return 'success';
    if (score >= 50) return 'warning';
    return 'danger';
  }

  upvotesLabel(): string {
    const detail = this.participation();
    const count = detail?.upvotesCount ?? detail?.upvotes?.length ?? 0;
    return `${count} vote${count > 1 ? 's' : ''}`;
  }

  editReview(review: IProjectParticipationReview): void {
    this.selectedReviewId.set(review.id);
  }

  resetReviewForm(resetSelection = true): void {
    if (resetSelection) {
      this.selectedReviewId.set(null);
    }

    this.reviewForm.controls.phaseId.enable({ emitEvent: false });
    this.reviewForm.reset({
      phaseId: this.latestPhase()?.id ?? '',
      score: '',
      message: '',
      notifyParticipant: false
    });
  }

  onSubmitReview(): void {
    const participationId = this.participationId();
    if (!participationId) return;

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const value = this.reviewForm.getRawValue();
    const message = value.message?.trim();

    this.store.review({
      participationId,
      dto: this.selectedReviewId()
        ? {
            reviewId: this.selectedReviewId()!,
            score: Number(value.score),
            message: message || undefined,
            notifyParticipant: !!value.notifyParticipant
          }
        : {
            phaseId: value.phaseId!,
            score: Number(value.score),
            message: message || undefined,
            notifyParticipant: !!value.notifyParticipant
          }
    });
  }
}
