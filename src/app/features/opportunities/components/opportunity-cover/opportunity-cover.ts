import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { OPPORTUNITY_DETAILS_ICONS } from '@shared/data';
import { IOpportunity } from '@shared/models';
import { ApiImgPipe } from '@shared/pipes/api-img.pipe';
import { FileUpload } from '@shared/ui';

@Component({
  selector: 'app-opportunity-cover',
  templateUrl: './opportunity-cover.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, ApiImgPipe, FileUpload]
})
export class OpportunityCover {
  opportunity = input.required<IOpportunity>();
  isLoading = input<boolean>(false);
  coverUploaded = output<void>();
  icons = OPPORTUNITY_DETAILS_ICONS;

  onCoverUploaded(): void {
    this.coverUploaded.emit();
  }
}
