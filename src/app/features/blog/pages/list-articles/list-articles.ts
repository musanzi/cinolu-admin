import { CommonModule } from '@angular/common';
import { Component, computed, DestroyRef, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FilterArticleDto } from '../../dto/filter-article.dto';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { LIST_ARTICLES_ICONS } from '@shared/data';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { ArticlesStore } from '../../store/articles.store';
import { UiAvatar, UiButton, UiConfirmDialog, UiPagination, UiTabs, UiBadge } from '@shared/ui';
import { IArticle } from '@shared/models';
import { ConfirmationService } from '@shared/services/confirmation';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { bindSearchControlToQuery, toPageQueryValue } from '@shared/helpers';

@Component({
  selector: 'app-article-list',
  providers: [ArticlesStore],
  imports: [
    LucideAngularModule,
    CommonModule,
    UiButton,
    ReactiveFormsModule,
    RouterLink,
    UiAvatar,
    ApiImgPipe,
    UiConfirmDialog,
    UiTabs,
    UiPagination,
    UiTableSkeleton,
    UiBadge
  ],
  templateUrl: './list-articles.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListArticles {
  icons = LIST_ARTICLES_ICONS;
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly confirmationService = inject(ConfirmationService);
  private readonly destroyRef = inject(DestroyRef);
  store = inject(ArticlesStore);
  itemsPerPage = 20;
  queryParams = signal<FilterArticleDto>({
    page: this.route.snapshot.queryParamMap.get('page'),
    q: this.route.snapshot.queryParamMap.get('q'),
    filter: (this.route.snapshot.queryParamMap.get('filter') as FilterArticleDto['filter']) || 'all'
  });
  activeTab = computed(() => this.queryParams().filter || 'all');
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  searchForm: FormGroup = this.fb.group({
    q: [this.queryParams().q || '']
  });
  tabsConfig = signal([
    { name: 'all', label: 'Tous' },
    { name: 'published', label: 'Publiés' },
    { name: 'drafts', label: 'Brouillons' },
    { name: 'highlighted', label: 'En vedette' }
  ]);

  constructor() {
    effect(() => {
      this.store.loadAll(this.queryParams());
    });
    bindSearchControlToQuery(this.searchForm.get('q'), this.queryParams, this.destroyRef, 1000);
  }

  onTabChange(tabName: string): void {
    const filter = tabName as FilterArticleDto['filter'];
    this.queryParams.update((qp) => ({ ...qp, filter, page: null }));
  }

  onPageChange(currentPage: number): void {
    this.queryParams.update((qp) => ({
      ...qp,
      page: toPageQueryValue(currentPage)
    }));
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({
      ...qp,
      q: null,
      page: null,
      filter: 'all'
    }));
  }

  onDelete(articleId: string): void {
    this.confirmationService.confirm({
      header: 'Confirmation',
      message: 'Êtes-vous sûr de vouloir supprimer cet article ?',
      acceptLabel: 'Supprimer',
      rejectLabel: 'Annuler',
      accept: () => {
        this.store.delete(articleId);
      }
    });
  }

  isPublished(article: IArticle): boolean {
    return !!article.published_at && new Date(article.published_at) <= new Date();
  }
}
