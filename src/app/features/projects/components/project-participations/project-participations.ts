import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators } from '@angular/forms';
import { distinctUntilChanged } from 'rxjs';
import { IPhase, IProject, IProjectParticipation } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { SelectOption } from '@shared/ui';
import { toPageQueryValue } from '@shared/helpers';
import { FilterParticipationsDto } from '@features/projects/dto/phases/filter-participations.dto';
import { ParticipationsStore } from '@features/projects/store/participations.store';
import { ProjectsStore } from '@features/projects/store/projects.store';
import { ProjectParticipationDetails } from './project-participation-details/project-participation-details';
import { ProjectParticipationsList } from './project-participations-list/project-participations-list';

function sortPhasesByStartDate(phases: IPhase[]): IPhase[] {
  return [...phases].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
}

function toPhaseOptions(phases: IPhase[]): SelectOption[] {
  return sortPhasesByStartDate(phases).map((phase) => ({ label: phase.name, value: phase.id }));
}

function latestPhase(participation: IProjectParticipation): IPhase | null {
  return sortPhasesByStartDate(participation.phases).at(-1) ?? null;
}

@Component({
  selector: 'app-project-participations',
  templateUrl: './project-participations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ParticipationsStore],
  imports: [ProjectParticipationsList, ProjectParticipationDetails]
})
export class ProjectParticipations {
  project = input.required<IProject>();
  #fb = inject(FormBuilder);
  #toast = inject(ToastrService);
  projectStore = inject(ProjectsStore);
  store = inject(ParticipationsStore);
  queryParams = signal<FilterParticipationsDto>({ page: null, phaseId: null });
  selectedIds = signal<string[]>([]);
  selectedParticipationId = signal<string | null>(null);
  filtersForm = this.#fb.group({
    phaseId: ['']
  });
  batchForm = this.#fb.group({
    phaseId: ['', Validators.required]
  });
  reviewForm = this.#fb.group({
    phaseId: ['', Validators.required],
    score: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    message: [''],
    notifyParticipant: [false]
  });

  itemsPerPage = 20;
  currentPage = computed(() => this.queryParams().page || 1);
  phaseOptions = computed<SelectOption[]>(() => toPhaseOptions(this.project().phases));
  reviewPhaseOptions = computed<SelectOption[]>(() => {
    const participation = this.store.participation();
    return participation ? toPhaseOptions(participation.phases) : [];
  });

  constructor() {
    effect(() => {
      this.store.loadAll({
        projectId: this.project().id,
        filters: this.queryParams()
      });
    });

    effect(() => {
      const pageIds = new Set(this.store.list().map((participation) => participation.id));
      this.selectedIds.update((ids) => ids.filter((id) => pageIds.has(id)));
    });

    effect(() => {
      const participation = this.store.participation();
      if (!participation) return;

      this.reviewForm.patchValue({
        phaseId: latestPhase(participation)?.id ?? '',
        score: '',
        message: participation.review_message ?? '',
        notifyParticipant: false
      });
    });

    this.filtersForm.controls.phaseId.valueChanges
      .pipe(distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((phaseId) => {
        this.queryParams.update((query) => ({
          ...query,
          phaseId: phaseId || null,
          page: null
        }));
      });
  }

  onPageChange(page: number): void {
    this.queryParams.update((query) => ({
      ...query,
      page: Number(toPageQueryValue(page) ?? 1)
    }));
  }

  onResetFilters(): void {
    this.filtersForm.patchValue({ phaseId: '' }, { emitEvent: false });
    this.queryParams.set({ page: null, phaseId: null });
  }

  onSelectParticipation(id: string): void {
    this.selectedParticipationId.set(id);
    this.store.loadOne(id);
  }

  toggleSelection(id: string, checked: boolean): void {
    this.selectedIds.update((ids) => {
      if (checked) {
        return ids.includes(id) ? ids : [...ids, id];
      }

      return ids.filter((item) => item !== id);
    });
  }

  toggleAll(checked: boolean): void {
    const pageIds = this.store.list().map((participation) => participation.id);

    this.selectedIds.update((ids) => {
      if (checked) {
        return Array.from(new Set([...ids, ...pageIds]));
      }

      return ids.filter((id) => !pageIds.includes(id));
    });
  }

  runBatchAction(mode: 'move' | 'remove'): void {
    if (!this.selectedIds().length) {
      this.#toast.showError('Sélectionnez au moins une participation');
      return;
    }

    if (this.batchForm.invalid) {
      this.batchForm.markAllAsTouched();
      return;
    }

    const phaseId = this.batchForm.getRawValue().phaseId!;
    const action = mode === 'move' ? this.store.moveToPhase : this.store.removeFromPhase;

    action({
      ids: this.selectedIds(),
      phaseId,
      onSuccess: () => {
        this.selectedIds.set([]);
        this.reloadCurrentData();
      }
    });
  }

  onSubmitReview(): void {
    const participationId = this.selectedParticipationId();
    if (!participationId) return;

    if (this.reviewForm.invalid) {
      this.reviewForm.markAllAsTouched();
      return;
    }

    const value = this.reviewForm.getRawValue();
    const reviewMessage = value.message?.trim();

    this.store.review({
      participationId,
      dto: {
        phaseId: value.phaseId!,
        score: Number(value.score),
        message: reviewMessage || undefined,
        notifyParticipant: !!value.notifyParticipant
      },
      onSuccess: () => this.reloadCurrentData()
    });
  }

  closeDetails(): void {
    this.selectedParticipationId.set(null);
    this.store.clearParticipation();
  }

  onImportCsv(file: File): void {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.#toast.showError('Le fichier doit être au format CSV');
      return;
    }

    this.projectStore.importParticipantsCsv({
      projectId: this.project().id,
      file,
      onSuccess: () => {
        this.reloadCurrentData();
        this.projectStore.loadOne(this.project().slug);
      }
    });
  }

  reloadCurrentData(): void {
    this.store.loadAll({
      projectId: this.project().id,
      filters: this.queryParams()
    });

    const participationId = this.selectedParticipationId();
    if (participationId) {
      this.store.loadOne(participationId);
    }
  }
}
