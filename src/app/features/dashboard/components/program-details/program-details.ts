import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PROGRAM_DETAILS_ICONS } from '@shared/data';
import { UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent } from '@shared/ui/accordion';
import type { IProgramParticipations } from '../../types';

@Component({
  selector: 'app-program-details',
  templateUrl: './program-details.html',
  imports: [LucideAngularModule, UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProgramDetails {
  icons = PROGRAM_DETAILS_ICONS;
  program = input<IProgramParticipations | null>(null);
}
