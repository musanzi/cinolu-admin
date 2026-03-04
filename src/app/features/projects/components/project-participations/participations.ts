import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  signal,
  viewChild
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  Users,
  Search,
  CircleArrowRight,
  X,
  Check,
  Upload,
  Trash2,
  ChevronDown
} from 'lucide-angular';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { UiAvatar, UiBadge, UiButton, UiPagination, UiSelect } from '@shared/ui';
import { IProject, IProjectParticipation } from '@shared/models';
import { PhasesStore } from '@features/projects/store/phases.store';
import { ProjectsStore } from '@features/projects/store/projects.store';
import { ParticipationDetail } from './participation-detail/participation-detail';
import { getParticipationKey } from '@features/projects/helpers';
import { FilterParticipationsDto } from '@features/projects/dto/phases/filter-participations.dto';

@Component({
  selector: 'app-participations',
  templateUrl: './participations.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ProjectsStore, PhasesStore],
  imports: [
    FormsModule,
    LucideAngularModule,
    ApiImgPipe,
    UiAvatar,
    UiBadge,
    UiButton,
    UiPagination,
    UiSelect,
    ParticipationDetail
  ]
})
export class Participations {
  project = input.required<IProject | null>();
  phasesStore = inject(PhasesStore);
  projectsStore = inject(ProjectsStore);
  selectedPhase = signal<string | null>(null);
  searchQuery = signal('');
  currentPage = signal(1);
  selectedIds = signal<Set<string>>(new Set());
  expandedParticipationKey = signal<string | null>(null);
  operationType = signal('move');
  moveTargetPhase = signal<string | null>(null);
  removeTargetPhase = signal<string | null>(null);
  selectedCsvFile = signal<File | null>(null);
  csvFileInput = viewChild<ElementRef<HTMLInputElement>>('csvFileInput');
  icons = { Users, Search, CircleArrowRight, X, Check, Upload, Trash2, ChevronDown };
  operationTypeOptions = [
    { label: 'Déplacer', value: 'move' },
    { label: 'Retirer', value: 'remove' }
  ];
  movePhaseOptions = computed(() =>
    this.phasesStore.sortedPhases().map((phase) => ({ label: phase.name, value: phase.id }))
  );
  selectedCount = computed(() => this.selectedIds().size);
  projectId = computed(() => this.project()?.id ?? null);
  projectSlug = computed(() => this.project()?.slug ?? null);
  requestDto = computed<FilterParticipationsDto>(() => ({
    page: this.currentPage(),
    q: this.searchQuery()
  }));
  isAllFilteredSelected = computed(() => {
    const ids = this.selectedIds();
    const keys = this.filteredParticipationKeys();
    return keys.length > 0 && keys.every((key) => ids.has(key));
  });
  rawParticipations = computed(() => this.projectsStore.participations()[0]);
  totalServerParticipations = computed(() => this.projectsStore.participations()[1]);
  participationsByPhase = computed(() => {
    const list = this.rawParticipations();
    const phaseId = this.selectedPhase();
    if (!phaseId) return list;
    return list.filter((p) => p.phases?.some((ph) => ph.id === phaseId) ?? false);
  });
  currentPhase = computed(() => {
    const phaseId = this.selectedPhase();
    if (!phaseId) return null;
    return this.phasesStore.sortedPhases().find((p) => p.id === phaseId) ?? null;
  });

  phaseFilterOptions = computed(() => {
    const phases = this.phasesStore.sortedPhases();
    const options = [{ label: `Tous (${this.totalServerParticipations()})`, value: '' }];
    for (const phase of phases) {
      options.push({ label: `${phase.name} (${phase?.participationsCount})`, value: phase.id });
    }
    return options;
  });

  constructor() {
    this.setupEffects();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  selectPhase(phaseId: string | null): void {
    this.selectedPhase.set(phaseId);
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAll(): void {
    const filteredIds = this.filteredParticipationKeys();
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (this.isAllFilteredSelected()) {
        filteredIds.forEach((id) => next.delete(id));
      } else {
        filteredIds.forEach((id) => next.add(id));
      }
      return next;
    });
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(p: IProjectParticipation): boolean {
    return this.selectedIds().has(getParticipationKey(p));
  }

  toggleDetail(p: IProjectParticipation): void {
    const key = getParticipationKey(p);
    this.expandedParticipationKey.update((current) => (current === key ? null : key));
  }

  isDetailExpanded(p: IProjectParticipation): boolean {
    return this.expandedParticipationKey() === getParticipationKey(p);
  }

  moveToPhase(): void {
    this.executePhaseOperation(this.moveTargetPhase(), 'move');
  }

  removeFromPhase(): void {
    this.executePhaseOperation(this.removeTargetPhase(), 'remove');
  }

  triggerCsvFileSelect(): void {
    this.csvFileInput()?.nativeElement?.click();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.selectedCsvFile.set(file?.name.toLowerCase().endsWith('.csv') ? file : null);
    input.value = '';
  }

  clearCsvSelection(): void {
    this.selectedCsvFile.set(null);
  }

  importCsv(): void {
    const projectId = this.projectId();
    const projectSlug = this.projectSlug();
    const file = this.selectedCsvFile();
    if (!projectId || !projectSlug || !file) return;

    this.projectsStore.importParticipantsCsv({
      projectId,
      file,
      onSuccess: () => {
        this.refreshProjectData();
        this.clearCsvSelection();
      }
    });
  }

  private setupEffects(): void {
    effect(() => {
      const projectId = this.projectId();
      if (projectId) this.phasesStore.loadAll(projectId);
    });

    effect(() => {
      this.searchQuery();
      this.selectedPhase();
      this.currentPage.set(1);
    });

    effect(() => {
      const projectId = this.projectId();
      if (!projectId) return;
      this.projectsStore.loadParticipations({ projectId, dto: this.requestDto() });
    });
  }

  private executePhaseOperation(phaseId: string | null, operation: string): void {
    const ids = this.getParticipationsIds();
    const projectSlug = this.projectSlug();
    if (!phaseId || ids.length === 0 || !projectSlug) return;

    const handler =
      operation === 'move' ? this.projectsStore.moveParticipations : this.projectsStore.removeParticipations;
    const targetSignal = operation === 'move' ? this.moveTargetPhase : this.removeTargetPhase;

    handler.call(this.projectsStore, {
      dto: { ids, phaseId },
      onSuccess: () => {
        this.refreshProjectData();
        this.clearSelection();
        targetSignal.set(null);
      }
    });
  }

  private refreshProjectData(): void {
    const projectSlug = this.projectSlug();
    const projectId = this.projectId();
    if (projectSlug) this.projectsStore.loadOne(projectSlug);
    if (projectId) this.projectsStore.loadParticipations({ projectId, dto: this.requestDto() });
  }

  private filteredParticipationKeys(): string[] {
    return this.participationsByPhase().map(getParticipationKey);
  }

  private getParticipationsIds(): string[] {
    const selectedKeys = this.selectedIds();
    return this.rawParticipations()
      .filter((p) => selectedKeys.has(getParticipationKey(p)))
      .map((p) => p.id);
  }
}
