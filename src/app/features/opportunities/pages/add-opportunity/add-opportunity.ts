import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { formatDate, markAllAsTouched } from '@shared/helpers';
import { OpportunityLanguage } from '@shared/models';
import { SelectOption, UiButton, UiDatepicker, UiInput, UiSelect, UiTextarea } from '@shared/ui';
import { OpportunitiesStore } from '../../store/opportunities.store';

@Component({
  selector: 'app-add-opportunity',
  templateUrl: './add-opportunity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OpportunitiesStore],
  imports: [ReactiveFormsModule, UiButton, UiDatepicker, UiInput, UiSelect, UiTextarea]
})
export class AddOpportunity {
  private readonly fb = inject(FormBuilder);
  store = inject(OpportunitiesStore);
  languageOptions: SelectOption[] = [
    { label: 'Français', value: 'fr' satisfies OpportunityLanguage },
    { label: 'English', value: 'en' satisfies OpportunityLanguage }
  ];
  form: FormGroup = this.fb.group({
    title: ['', Validators.required],
    description: ['', Validators.required],
    due_date: [null as Date | null, Validators.required],
    link: ['', Validators.required],
    language: ['fr', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) {
      markAllAsTouched(this.form);
      return;
    }
    const value = this.form.getRawValue();
    this.store.create({
      ...value,
      due_date: formatDate(value.due_date)
    });
  }
}
