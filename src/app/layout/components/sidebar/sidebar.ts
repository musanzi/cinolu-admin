import { Component, computed, inject, input, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SIDEBAR_ICONS } from '@shared/data';
import { filter } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LINK_GROUPS } from '../../data/links.data';
import { ILinkGroup } from '../../types/link.type';
import { environment } from '@env/environment';
import { NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  imports: [RouterModule, LucideAngularModule, NgOptimizedImage],
  templateUrl: './sidebar.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Sidebar {
  icons = SIDEBAR_ICONS;
  #router = inject(Router);
  style = input<string>();
  appUrl = environment.appUrl;
  currentUrl = signal(this.#router.url);
  toggleTab = signal<string | null>(null);
  closedTab = signal<string | null>(null);
  authStore = inject(AuthStore);
  linkGroups = signal<ILinkGroup[]>(LINK_GROUPS);
  allLinks = computed(() => this.linkGroups().flatMap((group) => group.links));

  activeTab = computed(() => {
    const url = this.currentUrl();
    return (
      this.allLinks().find((link) => {
        return link.path === url || link.children?.some((child) => child.path && url.startsWith(child.path));
      })?.name ?? null
    );
  });

  constructor() {
    this.#router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed()
      )
      .subscribe((event: NavigationEnd) => {
        this.currentUrl.set(event.urlAfterRedirects);
      });
  }

  onToggleTab(name: string): void {
    const currentlyOpen = this.isTabOpen(name);
    if (currentlyOpen) {
      this.closedTab.set(name);
      this.toggleTab.set(null);
    } else {
      this.closedTab.set(null);
      this.toggleTab.set(name);
    }
  }

  isTabOpen(name: string): boolean {
    if (this.closedTab() === name) return false;
    if (this.toggleTab()) return this.toggleTab() === name;
    return this.activeTab() === name;
  }

  // panelId(name: string): string {
  //   return 'sidebar-panel-' + name.toLowerCase().replace(/\s+/g, '-');
  // }
}
