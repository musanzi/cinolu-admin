import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { UiAccordionPanel } from '../accordion-panel/accordion-panel';

@Component({
  selector: 'app-ui-accordion-content',
  templateUrl: './accordion-content.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiAccordionContent {
  panel = inject(UiAccordionPanel, { optional: true });
}
