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
  activeParticipationId = signal<string | null>(null);
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
  allVisibleSelected = computed(() => {
    const participations = this.rawParticipations();
    if (participations.length === 0) return false;
    const selectedIds = this.selectedIds();
    return participations.every((participation) => selectedIds.has(participation.id));
  });
  hasSomeVisibleSelected = computed(() => {
    const participations = this.participationsByPhase();
    if (participations.length === 0) return false;
    const selectedIds = this.selectedIds();
    const selectedVisibleCount = participations.filter((participation) => selectedIds.has(participation.id)).length;
    return selectedVisibleCount > 0 && selectedVisibleCount < participations.length;
  });
  requestDto = computed<FilterParticipationsDto>(() => ({
    page: this.currentPage(),
    q: this.searchQuery(),
    phaseId: this.selectedPhase()
  }));
  rawParticipations = computed(() => this.projectsStore.participations()[0]);
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
    const options = [{ label: `Tous (${this.projectsStore.participations()[1]})`, value: '' }];
    for (const phase of phases) {
      options.push({ label: `${phase.name} (${phase?.participationsCount})`, value: phase.id });
    }
    return options;
  });

  constructor() {
    this.setupEffects();
  }

  onActiveParticipationChange(id: string): void {
    this.activeParticipationId.update((v) => (v === id ? null : id));
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  toggleSelect(id: string): void {
    this.selectedIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  toggleSelectAllVisible(checked: boolean): void {
    if (!checked) {
      this.selectedIds.update((current) => {
        const next = new Set(current);
        for (const participation of this.participationsByPhase()) {
          next.delete(participation.id);
        }
        return next;
      });
      return;
    }

    this.selectedIds.update((current) => {
      const next = new Set(current);
      for (const participation of this.participationsByPhase()) {
        next.add(participation.id);
      }
      return next;
    });
  }

  onSelectAllChange(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.toggleSelectAllVisible(checked);
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
  }

  isSelected(p: IProjectParticipation): boolean {
    return this.selectedIds().has(p.id);
  }

  moveToPhase(): void {
    const phaseId = this.selectedPhase();
    if (!phaseId) return;
    this.projectsStore.moveParticipations({
      dto: { ids: [...this.selectedIds()], phaseId },
      onSuccess: () => {
        this.refreshProjectData();
        this.clearSelection();
      }
    });
  }

  removeFromPhase(): void {
    const phaseId = this.selectedPhase();
    if (!phaseId) return;
    this.projectsStore.removeParticipations({
      dto: { ids: [...this.selectedIds()], phaseId },
      onSuccess: () => {
        this.refreshProjectData();
        this.clearSelection();
      }
    });
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
    const projectId = this.project()?.id;
    const file = this.selectedCsvFile();
    if (!projectId || !file) return;
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
      const projectId = this.project()?.id;
      if (projectId) this.phasesStore.loadAll(projectId);
    });
    effect(() => {
      this.searchQuery();
      this.selectedPhase();
      this.currentPage.set(1);
    });
    effect(() => {
      const projectId = this.project()?.id;
      if (!projectId) return;
      this.projectsStore.loadParticipations({ projectId, dto: this.requestDto() });
    });
  }

  private refreshProjectData(): void {
    const projectSlug = this.project()?.slug;
    const projectId = this.project()?.id;
    if (projectSlug) this.projectsStore.loadOne(projectSlug);
    if (projectId) this.projectsStore.loadParticipations({ projectId, dto: this.requestDto() });
  }
}
