import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { STATS_OVERVIEW_ICONS } from '@shared/data';
import type { IGeneralStats } from '../../types';

@Component({
  selector: 'app-stats-overview',
  templateUrl: './stats-overview.html',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatsOverview {
  icons = STATS_OVERVIEW_ICONS;
  data = input<IGeneralStats | null>(null);
  isLoading = input<boolean>(false);
}
