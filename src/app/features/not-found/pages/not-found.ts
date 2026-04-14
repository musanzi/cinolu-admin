import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { NOT_FOUND_PAGE_ICONS } from '@shared/data';
import { Location } from '@angular/common';
import { UiButton } from '@ui';

@Component({
  selector: 'app-not-found',
  imports: [LucideAngularModule, RouterModule, UiButton],
  templateUrl: './not-found.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NotFoundPage {
  icons = NOT_FOUND_PAGE_ICONS;
  private readonly location = inject(Location);

  goBack(): void {
    this.location.back();
  }
}
