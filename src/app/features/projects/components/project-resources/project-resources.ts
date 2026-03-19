import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '@env/environment';
import { IPhase, IResource, ResourceCategory } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import {
  SelectOption,
  UiBadge,
  UiButton,
  UiConfirmDialog,
  UiInput,
  UiPagination,
  UiSelect,
  UiTextarea
} from '@shared/ui';
import { LucideAngularModule } from 'lucide-angular';
import { Eye, FilePenLine, FileText, FolderOpen, Pencil, Plus, Trash2, Upload } from 'lucide-angular';
import { CreateResourceDto, UpdateResourceDto } from '../../dto/resources/create-resource.dto';
import { FilterResourcesDto } from '../../dto/resources/filter-resources.dto';
import { ResourcesStore } from '../../store/resources.store';
import { RESOURCE_CATEGORY_LABELS, RESOURCE_CATEGORY_OPTIONS } from '../../types/resources.types';

@Component({
  selector: 'app-project-resources',
  templateUrl: './project-resources.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ResourcesStore],
  imports: [
    DatePipe,
    ReactiveFormsModule,
    UiBadge,
    UiButton,
    UiConfirmDialog,
    UiInput,
    UiPagination,
    UiSelect,
    UiTextarea,
    LucideAngularModule
  ]
})
export class ProjectResources {
  projectId = input.required<string>();
  phases = input<IPhase[]>([]);
  #fb = inject(FormBuilder);
  #destroyRef = inject(DestroyRef);
  #confirmationService = inject(ConfirmationService);
  resourcesStore = inject(ResourcesStore);
  icons = { Plus, FileText, Pencil, Trash2, Eye, Upload, FolderOpen, FilePenLine };
  categoryOptions = RESOURCE_CATEGORY_OPTIONS;
  filterCategoryOptions: SelectOption[] = [{ label: 'Toutes les catégories', value: '' }, ...RESOURCE_CATEGORY_OPTIONS];
  scopeOptions: SelectOption[] = [
    { label: 'Projet', value: 'project' },
    { label: 'Phase', value: 'phase' }
  ];
  currentPage = signal(1);
  selectedCategory = signal<ResourceCategory | null>(null);
  selectedFile = signal<File | null>(null);
  replaceTargetId = signal<string | null>(null);
  editingResourceId = signal<string | null>(null);
  showForm = signal(false);
  resourceForm = this.#fb.group({
    title: ['', [Validators.required, Validators.minLength(2)]],
    description: ['', Validators.required],
    category: [ResourceCategory.OTHER, Validators.required],
    scope: ['project', Validators.required],
    phase_id: ['']
  });
  filtersForm = this.#fb.group({
    category: ['']
  });
  phaseOptions = computed<SelectOption[]>(() => [
    { label: 'Choisir une phase', value: '' },
    ...this.phases().map((phase) => ({ label: phase.name, value: phase.id }))
  ]);
  filters = computed<FilterResourcesDto>(() => ({
    page: this.currentPage() > 1 ? this.currentPage() : null,
    category: this.selectedCategory()
  }));

  constructor() {
    this.filtersForm
      .get('category')
      ?.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((value) => {
        this.selectedCategory.set((value as ResourceCategory) || null);
        this.currentPage.set(1);
      });

    effect(() => {
      this.resourcesStore.loadAll({ projectId: this.projectId(), filters: this.filters() });
    });
  }

  onCreateClick(): void {
    this.showForm.set(true);
    this.editingResourceId.set(null);
    this.selectedFile.set(null);
    this.resourceForm.reset({
      title: '',
      description: '',
      category: ResourceCategory.OTHER,
      scope: 'project',
      phase_id: ''
    });
  }

  onEdit(resource: IResource): void {
    this.showForm.set(true);
    this.editingResourceId.set(resource.id);
    this.selectedFile.set(null);
    this.resourceForm.reset({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      scope: resource.phase ? 'phase' : 'project',
      phase_id: resource.phase?.id ?? ''
    });
  }

  onCancelForm(): void {
    this.showForm.set(false);
    this.editingResourceId.set(null);
    this.selectedFile.set(null);
  }

  onSelectCreateFile(input: HTMLInputElement): void {
    const file = input.files?.[0] ?? null;
    this.selectedFile.set(file);
  }

  onReplaceFile(resourceId: string, input: HTMLInputElement): void {
    this.replaceTargetId.set(resourceId);
    input.click();
  }

  onReplaceSelection(input: HTMLInputElement): void {
    const file = input.files?.[0] ?? null;
    const resourceId = this.replaceTargetId();
    if (!file || !resourceId) return;
    this.resourcesStore.replaceFile({ id: resourceId, file });
    input.value = '';
    this.replaceTargetId.set(null);
  }

  onSubmit(): void {
    if (this.resourceForm.invalid) return;
    const resourceId = this.editingResourceId();
    if (resourceId) {
      this.resourcesStore.update({
        id: resourceId,
        dto: this.resourceForm.value as UpdateResourceDto,
        onSuccess: () => this.onCancelForm()
      });
      return;
    }
    const selectedFile = this.selectedFile();
    if (!selectedFile) return;
    const scope = this.resourceForm.value.scope ?? 'project';
    const phaseId = this.resourceForm.value.phase_id ?? '';
    const payload = {
      ...this.resourceForm.value,
      project_id: this.projectId(),
      phase_id: phaseId
    } as CreateResourceDto;
    if (scope === 'phase' && !phaseId) {
      this.resourceForm.get('phase_id')?.markAsTouched();
      this.resourceForm.get('phase_id')?.setErrors({ required: true });
      return;
    }
    this.resourcesStore.create({
      dto: payload,
      file: selectedFile,
      onSuccess: () => {
        this.onCancelForm();
      }
    });
  }

  onDelete(resource: IResource): void {
    this.#confirmationService.confirm({
      header: 'Supprimer la ressource',
      message: `Êtes-vous sûr de vouloir supprimer « ${resource.title} » ?`,
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => this.resourcesStore.delete(resource.id)
    });
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
  }

  categoryLabel(category: ResourceCategory): string {
    return RESOURCE_CATEGORY_LABELS[category];
  }

  scopeLabel(resource: IResource): string {
    return resource.phase?.name ?? 'Projet';
  }

  fileUrl(resource: IResource): string {
    return `${environment.apiUrl}uploads/resources/${resource.file}`;
  }

  fileName(resource: IResource): string {
    return resource.file.split('/').pop() || resource.file;
  }

  canSubmit(): boolean {
    return (
      this.resourceForm.valid &&
      (!!this.editingResourceId() || !!this.selectedFile()) &&
      !this.resourcesStore.isSaving()
    );
  }
}
