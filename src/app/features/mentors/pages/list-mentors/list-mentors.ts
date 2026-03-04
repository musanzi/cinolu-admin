import { Component, computed, DestroyRef, effect, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { LucideAngularModule, Search, Funnel, Eye, CircleCheckBig, CircleX, Pencil } from 'lucide-angular';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MentorsStore } from '../../store/mentors.store';
import { FilterMentorsProfileDto } from '../../dto/mentors/filter-mentors-profiles.dto';
import { MentorStatus } from '../../enums/mentor.enum';
import { UiButton, UiPagination, UiTabs, UiBadge } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';
import { bindSearchControlToQuery, toPageQueryValue } from '@shared/helpers';

@Component({
  selector: 'app-mentors-list',
  templateUrl: './list-mentors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MentorsStore],
  imports: [
    LucideAngularModule,
    UiButton,
    ReactiveFormsModule,
    RouterLink,
    UiPagination,
    UiTabs,
    UiTableSkeleton,
    UiBadge
  ]
})
export class ListMentors {
  #route = inject(ActivatedRoute);
  #fb = inject(FormBuilder);
  #destroyRef = inject(DestroyRef);
  store = inject(MentorsStore);
  itemsPerPage = 20;
  icons = { Eye, Search, Funnel, CircleCheckBig, CircleX, Pencil };
  queryParams = signal<FilterMentorsProfileDto>({
    page: this.#route.snapshot.queryParamMap.get('page'),
    q: this.#route.snapshot.queryParamMap.get('q'),
    status: (this.#route.snapshot.queryParamMap.get('status') as MentorStatus) || null
  });
  activeTab = computed(() => this.queryParams().status || 'all');
  currentPage = computed(() => Number(this.queryParams().page) || 1);
  searchForm: FormGroup = this.#fb.group({
    q: [this.queryParams().q || '']
  });
  tabsConfig = signal([
    { label: 'Tous', name: 'all' },
    { label: 'En attente', name: MentorStatus.PENDING },
    { label: 'Approuvés', name: MentorStatus.APPROVED },
    { label: 'Rejetés', name: MentorStatus.REJECTED }
  ]);

  constructor() {
    effect(() => {
      this.store.loadAll(this.queryParams());
    });
    bindSearchControlToQuery(this.searchForm.get('q'), this.queryParams, this.#destroyRef, 1000);
  }

  onTabChange(tabName: string): void {
    const status = tabName === 'all' ? null : (tabName as MentorStatus);
    this.queryParams.update((qp) => ({ ...qp, status, page: null }));
  }

  onPageChange(currentPage: number): void {
    this.queryParams.update((qp) => ({
      ...qp,
      page: toPageQueryValue(currentPage)
    }));
  }

  onResetFilters(): void {
    this.searchForm.patchValue({ q: '' });
    this.queryParams.update((qp) => ({ ...qp, q: null, page: null, status: null }));
  }
}
