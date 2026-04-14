import { Component, input, signal, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-ui-accordion',
  templateUrl: './accordion.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiAccordion {
  multiple = input<boolean>(false);
  activeValues = signal<Set<string>>(new Set());

  toggle(value: string): void {
    const values = new Set(this.activeValues());
    if (values.has(value)) {
      values.delete(value);
    } else {
      if (!this.multiple()) {
        values.clear();
      }
      values.add(value);
    }
    this.activeValues.set(values);
  }

  isActive(value: string): boolean {
    return this.activeValues().has(value);
  }
}
