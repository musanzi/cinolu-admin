import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { ADD_PROGRAM_PAGE_ICONS } from '@shared/data';
import { ProgramsStore } from '../../store/programs.store';
import { ProgramDto } from '../../dto/programs/program.dto';
import { CategoriesStore } from '@features/projects/store/project-categories.store';
import { ProgramSectorsStore } from '../../store/program-sectors.store';
import { UiButton, UiInput, UiSelect, UiTextarea } from '@shared/ui';

@Component({
  selector: 'app-add-program',
  providers: [ProgramsStore, CategoriesStore, ProgramSectorsStore],
  imports: [ReactiveFormsModule, UiButton, UiInput, UiSelect, UiTextarea, LucideAngularModule],
  templateUrl: './add-program.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddProgramPage {
  icons = ADD_PROGRAM_PAGE_ICONS;
  private readonly fb = inject(FormBuilder);
  store = inject(ProgramsStore);
  categoriesStore = inject(CategoriesStore);
  sectorsStore = inject(ProgramSectorsStore);
  form = this.fb.group({
    name: ['', Validators.required],
    description: ['', Validators.required],
    category: ['', Validators.required],
    sector: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.form.invalid) return;
    this.store.create(this.form.value as ProgramDto);
  }

  onCreateSector(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const existingSector = this.sectorsStore
      .sectors()
      .find((sector) => sector.name.trim().toLowerCase() === trimmedName.toLowerCase());

    if (existingSector) {
      this.form.patchValue({ sector: existingSector.id });
      return;
    }

    this.sectorsStore.create({
      payload: { name: trimmedName },
      onSuccess: (sector) => {
        this.form.patchValue({ sector: sector.id });
      }
    });
  }

  constructor() {
    this.categoriesStore.loadUnpaginated();
    this.sectorsStore.loadAll();
  }
}
