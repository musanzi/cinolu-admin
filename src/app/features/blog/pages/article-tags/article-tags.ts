import { Component, computed, DestroyRef, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { ARTICLE_TAGS_ICONS } from '@shared/data';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TagsStore } from '../../store/tags.store';
import { ActivatedRoute } from '@angular/router';
import { FilterArticlesTagsDto } from '../../dto/filter-tags.dto';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { UiButton, UiConfirmDialog, UiInput, UiPagination, UiBadge } from '@shared/ui';
import { ITag } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

@Component({
  selector: 'app-article-tags',
  providers: [TagsStore],
  imports: [
    LucideAngularModule,
    ReactiveFormsModule,
    UiButton,
    UiInput,
    UiConfirmDialog,
    UiPagination,
    UiTableSkeleton,
    UiBadge
  ],
  templateUrl: './article-tags.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleTags {
  icons = ARTICLE_TAGS_ICONS;
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  store = inject(TagsStore);
  itemsPerPage = 10;
  queryParams = signal<FilterArticlesTagsDto>({
    page: this.route.snapshot.queryParamMap.get('page'),
    q: this.route.snapshot.queryParamMap.get('q')
  });
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  isCreating = signal(false);
  editingTagId = signal<string | null>(null);
  searchForm: FormGroup = this.fb.group({
    q: [this.queryParams().q || '']
  });
  createForm: FormGroup = this.fb.group({
    name: ['', Validators.required]
  });
  updateForm: FormGroup = this.fb.group({
    name: ['', Validators.required]
  });

  constructor() {
    effect(() => {
      this.store.loadAll(this.queryParams());
    });
    const searchValue = this.searchForm.get('q');
    searchValue?.valueChanges
      .pipe(debounceTime(1000), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe((searchValue: string) => {
        this.queryParams.update((qp) => ({ ...qp, q: searchValue, page: null }));
      });
  }

  onPageChange(currentPage: number): void {
    this.queryParams.update((qp) => ({
      ...qp,
      page: currentPage === 1 ? null : currentPage.toString()
    }));
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({
      ...qp,
      q: null,
      page: null
    }));
  }

  onDelete(id: string): void {
    this.confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer ce tag ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete({ id });
      }
    });
  }

  onToggleCreation(): void {
    this.isCreating.update((visible) => !visible);
    if (!this.isCreating()) {
      this.createForm.reset({ name: '' });
    }
  }

  onCancelCreation(): void {
    this.isCreating.set(false);
    this.createForm.reset({ name: '' });
  }

  onCreate(): void {
    if (this.createForm.invalid) return;
    const { name } = this.createForm.value;
    this.store.create({
      payload: { name },
      onSuccess: () => this.onCancelCreation()
    });
  }

  onEdit(tag: ITag): void {
    this.editingTagId.set(tag.id);
    this.updateForm.patchValue({ name: tag.name });
  }

  onCancelUpdate(): void {
    this.editingTagId.set(null);
    this.updateForm.reset({ name: '' });
  }

  onUpdate(): void {
    if (this.updateForm.invalid) return;
    const { name } = this.updateForm.value;
    this.store.update({
      id: this.editingTagId() || '',
      payload: { name },
      onSuccess: () => this.onCancelUpdate()
    });
  }

  isEditing(tagId: string): boolean {
    return this.editingTagId() === tagId;
  }
}
