import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-ui-avatar',
  imports: [NgOptimizedImage],
  templateUrl: './avatar.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UiAvatar {
  label = input<string>('');
  image = input<string | null>(null);
  shape = input<'circle' | 'square'>('circle');

  avatarClasses() {
    return [this.shape() === 'square' ? 'rounded-md' : 'rounded-full'].filter(Boolean).join(' ');
  }
}
