import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ARTICLE_DETAILS_ICONS } from '@shared/data';
import { UiTabs, UiButton } from '@shared/ui';
import { ArticlesStore } from '../../store/articles.store';
import { ArticleUpdate } from '../../components/article-update/article-update';
import { ArticleGalleryComponent } from '../../components/article-gallery/article-gallery';

@Component({
  selector: 'app-update-details',
  providers: [ArticlesStore],
  imports: [CommonModule, UiTabs, ArticleUpdate, ArticleGalleryComponent, LucideAngularModule, UiButton],
  templateUrl: './article-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ArticleDetails implements OnInit {
  icons = ARTICLE_DETAILS_ICONS;
  private readonly route = inject(ActivatedRoute);
  private readonly slug = this.route.snapshot.params['slug'];
  store = inject(ArticlesStore);
  activeTab = signal('edit');
  tabs = [
    { label: "Mettre à jour l'article", name: 'edit', icon: this.icons.SquarePen },
    { label: 'Gérer la galerie', name: 'gallery', icon: this.icons.Images }
  ];

  ngOnInit(): void {
    this.store.loadOne(this.slug);
    this.store.loadGallery(this.slug);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onGalleryUploaded(): void {
    this.store.loadGallery(this.slug);
  }

  onCoverUploaded(): void {
    this.store.loadOne(this.slug);
  }

  onDeleteImage(imgId: string): void {
    this.store.deleteImage(imgId);
  }

  onShowcase(): void {
    const article = this.store.article();
    if (!article) return;
    this.store.showcase(article.id);
  }
}
