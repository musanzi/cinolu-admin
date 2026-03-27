import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input, output, viewChild, ElementRef } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ArrowRight, Download, RefreshCcw, Search, Upload, X, LucideAngularModule } from 'lucide-angular';
import { ApiImgPipe } from '@shared/pipes';
import { IProjectParticipation } from '@shared/models';
import { SelectOption, UiAvatar, UiBadge, UiButton, UiCheckbox, UiPagination, UiSelect } from '@shared/ui';
import { UiTableSkeleton } from '@shared/ui/table-skeleton/table-skeleton';

interface SelectionChange {
  id: string;
  checked: boolean;
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
  participations = input.required<IProjectParticipation[]>();
  totalCount = input.required<number>();
  selectedIds = input.required<string[]>();
  isLoading = input(false);
  isSaving = input(false);
  isImportingCsv = input(false);
  currentPage = input.required<number>();
  itemsPerPage = input.required<number>();
  filtersForm = input.required<FormGroup>();
  batchForm = input.required<FormGroup>();
  phaseOptions = input.required<SelectOption[]>();
  pageChange = output<number>();
  resetFilters = output<void>();
  reload = output<void>();
  selectParticipation = output<string>();
  toggleSelection = output<SelectionChange>();
  toggleAll = output<boolean>();
  batchAction = output<'move' | 'remove'>();
  importCsv = output<File>();
  csvFileInput = viewChild<ElementRef<HTMLInputElement>>('csvFileInput');
  icons = { Upload, RefreshCcw, ArrowRight, X, Search, Download };
  selectedCount = computed(() => this.selectedIds().length);
  allSelectedOnPage = computed(() => {
    const pageIds = this.participations().map((participation) => participation.id);
    return pageIds.length > 0 && pageIds.every((id) => this.selectedIds().includes(id));
  });

  onTriggerCsvFileSelect(): void {
    this.csvFileInput()?.nativeElement.click();
  }

  onCsvFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (file) {
      this.importCsv.emit(file);
    }
  }

  onToggleSelection(id: string, checked: boolean): void {
    this.toggleSelection.emit({ id, checked });
  }

  phaseSummary(participation: IProjectParticipation): string {
    if (!participation.phases.length) return 'Aucune phase';
    return participation.phases.map((phase) => phase.name).join(', ');
  }

  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }
}
