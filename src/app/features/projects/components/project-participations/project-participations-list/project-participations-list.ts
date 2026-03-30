import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ArrowRight, Download, RefreshCcw, Search, Upload, X, LucideAngularModule } from 'lucide-angular';
import { distinctUntilChanged } from 'rxjs';
import { ApiImgPipe } from '@shared/pipes';
import { FilterParticipationsDto } from '@features/projects/dto/phases/filter-participations.dto';
import { ParticipationsStore } from '@features/projects/store/participations.store';
import { ProjectsStore } from '@features/projects/store/projects.store';
import { toPageQueryValue } from '@shared/helpers';
import { IPhase, IProject, IProjectParticipation } from '@shared/models';
import { ToastrService } from '@shared/services/toast/toastr.service';
import { SelectOption, UiAvatar, UiBadge, UiButton, UiCheckbox, UiPagination, UiSelect } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

function sortPhasesByStartDate(phases: IPhase[]): IPhase[] {
  return [...phases].sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime());
}

function toPhaseOptions(phases: IPhase[]): SelectOption[] {
  return sortPhasesByStartDate(phases).map((phase) => ({ label: phase.name, value: phase.id }));
}

@Component({
  selector: 'app-project-participations-list',
  templateUrl: './project-participations-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    LucideAngularModule,
    UiAvatar,
    UiBadge,
    UiButton,
    UiCheckbox,
    UiPagination,
    UiSelect,
    UiTableSkeleton,
    ApiImgPipe
  ]
})
export class ProjectParticipationsList {
  project = input.required<IProject>();
  #fb = inject(FormBuilder);
  #toast = inject(ToastrService);
  store = inject(ParticipationsStore);
  projectStore = inject(ProjectsStore);
  selectParticipation = output<string>();
  csvFileInput = viewChild<ElementRef<HTMLInputElement>>('csvFileInput');
  queryParams = signal<FilterParticipationsDto>({ page: null, phaseId: null });
  selectedIds = signal<string[]>([]);
  filtersForm = this.#fb.group({
    phaseId: ['']
  });
  batchForm = this.#fb.group({
    phaseId: ['', Validators.required]
  });
  icons = { Upload, RefreshCcw, ArrowRight, X, Search, Download };
  itemsPerPage = 20;
  currentPage = computed(() => this.queryParams().page || 1);
  participations = computed(() => this.store.participations());
  totalCount = computed(() => this.store.total());
  isLoading = computed(() => this.store.isLoading());
  isSaving = computed(() => this.store.isSaving());
  isImportingCsv = computed(() => this.projectStore.isImportingCsv());
  phaseOptions = computed<SelectOption[]>(() => toPhaseOptions(this.project().phases));
  selectedCount = computed(() => this.selectedIds().length);
  allSelectedOnPage = computed(() => {
    const pageIds = this.participations().map((participation) => participation.id);
    return pageIds.length > 0 && pageIds.every((id) => this.selectedIds().includes(id));
  });

  constructor() {
    effect(() => {
      this.store.loadAll({
        projectId: this.project().id,
        filters: this.queryParams()
      });
    });

    effect(() => {
      const pageIds = new Set(this.participations().map((participation) => participation.id));
      this.selectedIds.update((ids) => ids.filter((id) => pageIds.has(id)));
    });

    effect(() => {
      if (!this.store.isSaving() && !this.store.error()) {
        this.selectedIds.set([]);
        this.reloadCurrentData();
      }
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

  onTriggerCsvFileSelect(): void {
    this.csvFileInput()?.nativeElement.click();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }

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

  toggleSelection(id: string, checked: boolean): void {
    this.selectedIds.update((ids) => {
      if (checked) {
        return ids.includes(id) ? ids : [...ids, id];
      }

      return ids.filter((item) => item !== id);
    });
  }

  toggleAll(checked: boolean): void {
    const pageIds = this.participations().map((participation) => participation.id);

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
      phaseId
    });
  }

  reloadCurrentData(): void {
    this.store.loadAll({
      projectId: this.project().id,
      filters: this.queryParams()
    });
  }

  phaseSummary(participation: IProjectParticipation): string {
    if (!participation.phases.length) return 'Aucune phase';
    return participation.phases.map((phase) => phase.name).join(', ');
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }
}
