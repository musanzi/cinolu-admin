import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { IStatsSummary } from '@features/dashboard/types';
import { LucideAngularModule } from 'lucide-angular';
import { YEAR_SUMMARY_ICONS } from '@shared/data';

@Component({
  selector: 'app-year-summary',
  templateUrl: './year-summary.html',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class YearSummary {
  icons = YEAR_SUMMARY_ICONS;
  summary = input.required<IStatsSummary>();
}
