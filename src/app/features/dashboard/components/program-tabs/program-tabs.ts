import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PROGRAM_TABS_ICONS } from '@shared/data';
import type { IProgramParticipations } from '../../types';

@Component({
  selector: 'app-program-tabs',
  templateUrl: './program-tabs.html',
  imports: [LucideAngularModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramTabs {
  icons = PROGRAM_TABS_ICONS;
  programs = input.required<IProgramParticipations[]>();
  selectedProgramId = input<string | null>(null);
  programSelected = output<string>();

  onSelectProgram(programId: string): void {
    this.programSelected.emit(programId);
  }
}
