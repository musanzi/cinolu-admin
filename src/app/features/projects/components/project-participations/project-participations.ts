import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Star, Upload, Users, LucideAngularModule, MoveRight, CircleMinus } from 'lucide-angular';
import { toSearchQueryValue } from '@shared/helpers';
import { IProjectParticipation } from '@shared/models';
import {
  SelectOption,
  UiBadge,
  UiButton,
  UiCheckbox,
  UiConfirmDialog,
  UiInput,
  UiPagination,
  UiSelect
} from '@shared/ui';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
import { FilterParticipationsDto } from '../../dto/phases/filter-participations.dto';
import { PhasesStore } from '../../store/phases.store';
import { ParticipationsStore } from '../../store/participations.store';
import { ProjectsStore } from '../../store/projects.store';

@Component({
  selector: 'app-project-participations',
  templateUrl: './project-participations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ParticipationsStore, PhasesStore],
  imports: [
    FormsModule,
    ReactiveFormsModule,
    UiBadge,
    UiButton,
    UiCheckbox,
    UiConfirmDialog,
    UiInput,
    UiPagination,
    UiSelect,
    LucideAngularModule
  ]
})
export class ProjectParticipations {
  projectId = input.required<string>();
  #fb = inject(FormBuilder);
  #destroyRef = inject(DestroyRef);
  participationsStore = inject(ParticipationsStore);
  phasesStore = inject(PhasesStore);
  projectsStore = inject(ProjectsStore);
  filtersForm = this.#fb.group({
    q: [''],
    phaseId: ['']
  });
  currentPage = signal(1);
  selectedIds = signal<string[]>([]);
  actionPhaseId = signal('');
  searchQuery = signal<string | null>(null);
  phaseFilterId = signal<string | null>(null);
  icons = { Star, Upload, Users, MoveRight, CircleMinus };

  phaseOptions = computed<SelectOption[]>(() => [
    { label: 'Toutes les phases', value: '' },
    ...this.phasesStore.sortedPhases().map((phase) => ({ label: phase.name, value: phase.id }))
  ]);

  bulkPhaseOptions = computed<SelectOption[]>(() => [
    { label: 'Choisir une phase', value: '' },
    ...this.phasesStore.sortedPhases().map((phase) => ({ label: phase.name, value: phase.id }))
  ]);

  filters = computed<FilterParticipationsDto>(() => ({
    page: this.currentPage() > 1 ? this.currentPage() : null,
    q: this.searchQuery(),
    phaseId: this.phaseFilterId()
  }));

  allVisibleSelected = computed(() => {
    const list = this.participationsStore.list();
    return list.length > 0 && list.every((item) => this.selectedIds().includes(item.id));
  });

  hasSelection = computed(() => this.selectedIds().length > 0);
  totalVotes = computed(() =>
    this.participationsStore.list().reduce((sum, participation) => sum + (participation.upvotesCount ?? 0), 0)
  );

  canApplyBulkAction = computed(
    () => this.hasSelection() && !!this.actionPhaseId() && !this.participationsStore.isSaving()
  );

  constructor() {
    this.filtersForm
      .get('q')
      ?.valueChanges.pipe(
        map((value) => toSearchQueryValue(value)),
        debounceTime(500),
        distinctUntilChanged(),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe((value) => {
        this.searchQuery.set(value);
        this.currentPage.set(1);
      });

    this.filtersForm
      .get('phaseId')
      ?.valueChanges.pipe(
        map((value) => (value ? String(value) : null)),
        distinctUntilChanged(),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe((value) => {
        this.phaseFilterId.set(value);
        this.currentPage.set(1);
      });

    effect(() => {
      const projectId = this.projectId();
      this.phasesStore.loadAll(projectId);
    });

    effect(() => {
      const projectId = this.projectId();
      this.participationsStore.loadAll({ projectId, filters: this.filters() });
      this.selectedIds.set([]);
    });
  }

  ventureName(participation: IProjectParticipation): string {
    return participation.venture?.name || 'Aucune startup';
  }

  participantInitials(participation: IProjectParticipation): string {
    return participation.user.name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? '')
      .join('');
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  onToggleSelection(id: string, checked: boolean): void {
    this.selectedIds.update((ids) => (checked ? [...new Set([...ids, id])] : ids.filter((item) => item !== id)));
  }

  onToggleSelectAll(checked: boolean): void {
    const visibleIds = this.participationsStore.list().map((item) => item.id);
    this.selectedIds.set(checked ? visibleIds : []);
  }

  onBulkPhaseChange(value: unknown): void {
    this.actionPhaseId.set(String(value ?? ''));
  }

  onFilterPhaseChange(value: unknown): void {
    this.filtersForm.patchValue({ phaseId: String(value ?? '') });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  onImportCsvSelection(input: HTMLInputElement): void {
    const file = input.files?.[0] ?? null;
    if (!file) return;
    this.projectsStore.importParticipantsCsv({
      projectId: this.projectId(),
      file,
      onSuccess: () => this.refreshData()
    });
    input.value = '';
  }

  onMoveToPhase(): void {
    if (!this.canApplyBulkAction()) return;
    this.participationsStore.moveToPhase({
      ids: this.selectedIds(),
      phaseId: this.actionPhaseId(),
      onSuccess: () => this.onBulkActionSuccess()
    });
  }

  onRemoveFromPhase(): void {
    if (!this.canApplyBulkAction()) return;
    this.participationsStore.removeFromPhase({
      ids: this.selectedIds(),
      phaseId: this.actionPhaseId(),
      onSuccess: () => this.onBulkActionSuccess()
    });
  }

  private onBulkActionSuccess(): void {
    this.selectedIds.set([]);
    this.refreshData();
  }

  private refreshData(): void {
    this.participationsStore.loadAll({ projectId: this.projectId(), filters: this.filters() });
    const project = this.projectsStore.project();
    if (project?.slug) {
      this.projectsStore.loadOne(project.slug);
    }
  }
}
