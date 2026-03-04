import { Component, computed, ElementRef, inject, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import {
  LucideAngularModule,
  Menu,
  ChevronDown,
  LogOut,
  House,
  ExternalLink,
  Calendar
} from 'lucide-angular';
import { LINK_GROUPS } from '../../data/links.data';
import { IUser } from '@shared/models';
import { filter, fromEvent } from 'rxjs';
import { AuthStore } from '@core/auth/auth.store';
import { environment } from '@env/environment';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgOptimizedImage } from '@angular/common';
import { ILinkGroup } from '../../types/link.type';

@Component({
  selector: 'app-mobile-menu',
  templateUrl: './mobile-menu.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule, RouterModule, NgOptimizedImage]
})
export class MobileMenu {
  user = input.required<IUser | null>();
  signOut = output<void>();
  isOpen = signal<boolean>(false);
  icons = { Menu, Calendar, House, ChevronDown, LogOut, ExternalLink };
  #elementRef = inject(ElementRef);
  #router = inject(Router);
  style = input<string>();
  currentUrl = signal(this.#router.url);
  toggleTab = signal<string | null>(null);
  closedTab = signal<string | null>(null);
  authStore = inject(AuthStore);
  linkGroups = signal<ILinkGroup[]>(LINK_GROUPS);
  appUrl = environment.appUrl;
  allLinks = computed(() => this.linkGroups().flatMap((group) => group.links));

  activeTab = computed(() => {
    const url = this.currentUrl();
    return (
      this.allLinks().find(
        (link) =>
          link.path === url ||
          link.children?.some((child) => child.path && url.startsWith(child.path))
      )?.name ?? null
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
    this.setupEventListeners();
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

  panelId(name: string): string {
    return 'mobile-nav-panel-' + name.toLowerCase().replace(/\s+/g, '-');
  }

  setupEventListeners(): void {
    const click$ = fromEvent(document, 'click');
    click$.pipe(takeUntilDestroyed()).subscribe((event: Event) => {
      const isInside = this.#elementRef.nativeElement.contains(event.target);
      const isMenuOpen = this.isOpen();
      if (isMenuOpen && !isInside) this.closeNav();
    });
  }

  toggleNav(): void {
    this.isOpen.update((isOpen) => !isOpen);
  }

  handleSignOut(): void {
    this.signOut.emit();
  }

  closeNav(): void {
    this.isOpen.set(false);
  }
}
