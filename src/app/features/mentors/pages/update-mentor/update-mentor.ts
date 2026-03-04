import { ChangeDetectionStrategy, Component, effect, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { GENDERS } from '@shared/data';
import { markAllAsTouched, parseDate } from '@shared/helpers';
import { IExperience, IExpertise } from '@shared/models';
import { SelectOption, UiButton, UiCheckbox, UiDatepicker, UiInput, UiMultiSelect, UiSelect, UiTextarea } from '@shared/ui';
import { MentorsStore } from '../../store/mentors.store';
import { ExpertisesStore } from '../../store/expertises.store';
import { MentorType } from '../../enums/mentor.enum';
import {
  CreateExperienceDto,
  CreateMentorDto,
  MentorRequestDto
} from '../../dto/mentors/create-mentor.dto';
import { UpdateMentorSkeleton } from '../../ui/update-mentor-skeleton/update-mentor-skeleton';

@Component({
  selector: 'app-update-mentor',
  templateUrl: './update-mentor.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [MentorsStore, ExpertisesStore],
  imports: [
    UiInput,
    UiTextarea,
    UiDatepicker,
    UiSelect,
    UiMultiSelect,
    UiCheckbox,
    UiButton,
    ReactiveFormsModule,
    UpdateMentorSkeleton,
    RouterLink
  ]
})
export class UpdateMentor implements OnInit {
  #route = inject(ActivatedRoute);
  #fb = inject(FormBuilder);
  #mentorId = this.#route.snapshot.params['id'];
  store = inject(MentorsStore);
  expertisesStore = inject(ExpertisesStore);
  genders = GENDERS;
  mentorTypeOptions: SelectOption[] = [
    { label: 'Coach', value: MentorType.COACH },
    { label: 'Facilitator', value: MentorType.FACILITATOR }
  ];
  minBirthDate = new Date(1960, 0, 1);
  maxBirthDate = new Date(2020, 11, 31);
  form = this.#initForm();

  constructor() {
    effect(() => {
      const mentor = this.store.mentor();
      if (!mentor) return;
      this.form.patchValue({
        email: mentor.owner.email,
        name: mentor.owner.name,
        phone_number: mentor.owner.phone_number,
        gender: mentor.owner.gender,
        city: mentor.owner.city,
        birth_date: parseDate(mentor.owner.birth_date),
        country: mentor.owner.country,
        biography: mentor.owner.biography,
        years_experience: mentor.years_experience,
        expertises: mentor.expertises.map((expertise) => expertise.id),
        type: mentor.type ?? ''
      });
      this.#patchExperiences(mentor.experiences);
    });
  }

  ngOnInit(): void {
    this.store.loadOne(this.#mentorId);
    this.expertisesStore.loadUnpaginated();
  }

  get experiences(): FormArray<FormGroup> {
    return this.form.get('experiences') as FormArray<FormGroup>;
  }

  addExperience(): void {
    this.experiences.push(this.#buildExperienceForm());
  }

  removeExperience(index: number): void {
    if (this.experiences.length <= 1) {
      return;
    }
    this.experiences.removeAt(index);
  }

  onSubmit(): void {
    if (this.form.invalid) {
      markAllAsTouched(this.form);
      return;
    }
    this.store.update({ id: this.#mentorId, dto: this.#buildPayload() });
  }

  onCreateExpertise(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return;
    }

    const existingExpertise = this.expertisesStore
      .allExpertises()
      .find((expertise) => expertise.name.trim().toLowerCase() === trimmedName.toLowerCase());

    if (existingExpertise) {
      const currentValue = ((this.form.get('expertises')?.value as string[] | null) ?? []).filter(Boolean);
      if (!currentValue.includes(existingExpertise.id)) {
        this.form.patchValue({ expertises: [...currentValue, existingExpertise.id] });
      }
      return;
    }

    this.expertisesStore.create({
      payload: { name: trimmedName },
      onSuccess: (expertise: IExpertise) => {
        const currentValue = ((this.form.get('expertises')?.value as string[] | null) ?? []).filter(Boolean);
        if (!currentValue.includes(expertise.id)) {
          this.form.patchValue({ expertises: [...currentValue, expertise.id] });
        }
      }
    });
  }

  #patchExperiences(experiences: IExperience[]): void {
    this.experiences.clear();

    if (experiences.length === 0) {
      this.experiences.push(this.#buildExperienceForm());
      return;
    }

    for (const experience of experiences) {
      this.experiences.push(
        this.#buildExperienceForm({
          ...experience,
          start_date: parseDate(String(experience.start_date)),
          end_date: experience.end_date ? parseDate(String(experience.end_date)) : undefined
        })
      );
    }
  }

  #initForm(): FormGroup {
    return this.#fb.group({
      email: ['', [Validators.required, Validators.email]],
      name: ['', Validators.required],
      phone_number: [''],
      gender: [''],
      city: [''],
      birth_date: [''],
      country: [''],
      biography: [''],
      google_image: [''],
      years_experience: [0, [Validators.required, Validators.min(0)]],
      expertises: [[], Validators.required],
      type: [''],
      experiences: this.#fb.array([this.#buildExperienceForm()])
    });
  }

  #buildExperienceForm(
    experience?: Partial<{
      id: string;
      company_name: string;
      job_title: string;
      is_current: boolean;
      start_date: Date | string;
      end_date?: Date | string;
    }>
  ): FormGroup {
    return this.#fb.group({
      id: [experience?.id ?? ''],
      company_name: [experience?.company_name ?? '', Validators.required],
      job_title: [experience?.job_title ?? '', Validators.required],
      is_current: [experience?.is_current ?? false],
      start_date: [experience?.start_date ? parseDate(String(experience.start_date)) : new Date(), Validators.required],
      end_date: [experience?.end_date ? parseDate(String(experience.end_date)) : null]
    });
  }

  #buildPayload(): CreateMentorDto {
    const value = this.form.value;

    const experiences = this.experiences.controls.map((control) => {
      const row = control.value;
      const isCurrent = Boolean(row['is_current']);
      const startDate = this.#toOptionalApiDate(row['start_date']) ?? this.#toOptionalApiDate(new Date());

      return {
        id: this.#toOptionalString(row['id']),
        company_name: String(row['company_name']),
        job_title: String(row['job_title']),
        is_current: isCurrent,
        start_date: startDate ?? '',
        end_date: isCurrent ? undefined : this.#toOptionalApiDate(row['end_date'])
      } satisfies CreateExperienceDto;
    });

    const mentor: MentorRequestDto = {
      years_experience: Number(value['years_experience']),
      expertises: (value['expertises'] as string[]) ?? [],
      type: this.#toMentorType(value['type']),
      experiences
    };

    return { email: String(value['email']), mentor };
  }

  #toOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmedValue = value.trim();
    return trimmedValue ? trimmedValue : undefined;
  }

  #toOptionalApiDate(value: unknown): string | undefined {
    if (!value) {
      return undefined;
    }

    const date = value instanceof Date ? value : new Date(String(value));
    if (Number.isNaN(date.getTime())) {
      return undefined;
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  #toMentorType(value: unknown): MentorType | undefined {
    if (value === MentorType.COACH || value === MentorType.FACILITATOR) {
      return value;
    }
    return undefined;
  }
}
