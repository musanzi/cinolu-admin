import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SquarePen, Images, ChartColumn, Star, Eye, Layers, Users, Bell, LucideAngularModule } from 'lucide-angular';
import { UiTabs, UiButton } from '@shared/ui';
import { GalleryStore } from '../../store/project-gallery.store';
import { ProjectsStore } from '../../store/projects.store';
import { ProjectDetailsSkeleton } from '../../ui/project-details-skeleton/project-details-skeleton';
import { SubprogramsStore } from '@features/programs/store/subprograms.store';
import { CategoriesStore } from '@features/projects/store/project-categories.store';
import { UsersStore } from '@features/users/store/users.store';
import { ProjectSheet, ProjectGallery, ProjectUpdate, Phases } from '@features/projects/components';

@Component({
  selector: 'app-project-details',
  templateUrl: './project-details.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GalleryStore, ProjectsStore, CategoriesStore, SubprogramsStore, UsersStore],
  imports: [
    UiTabs,
    ProjectSheet,
    ProjectGallery,
    ProjectUpdate,
    Phases,
    ProjectDetailsSkeleton,
    LucideAngularModule,
    UiButton
  ]
})
export class ProjectDetails implements OnInit {
  #route = inject(ActivatedRoute);
  #slug = this.#route.snapshot.params['slug'];
  projectStore = inject(ProjectsStore);
  galleryStore = inject(GalleryStore);
  categoriesStore = inject(CategoriesStore);
  programsStore = inject(SubprogramsStore);
  usersStore = inject(UsersStore);
  activeTab = signal(this.#route.snapshot.queryParamMap.get('tab') || 'details');
  tabs = [
    { label: "Fiche d'activité", name: 'details', icon: ChartColumn },
    { label: 'Phases', name: 'phases', icon: Layers },
    { label: 'Participations', name: 'participations', icon: Users },
    { label: 'Notifications', name: 'notifications', icon: Bell },
    { label: 'Mettre à jour', name: 'edit', icon: SquarePen },
    { label: 'Galerie', name: 'gallery', icon: Images }
  ];

  ngOnInit(): void {
    this.projectStore.loadOne(this.#slug);
    this.galleryStore.loadAll(this.#slug);
    this.categoriesStore.loadUnpaginated();
    this.programsStore.loadUnpaginated();
    this.usersStore.loadStaff();
  }

  onCoverUploaded(): void {
    this.projectStore.loadOne(this.#slug);
  }

  onGalleryUploaded(): void {
    this.galleryStore.loadAll(this.#slug);
  }

  onDeleteImage(id: string): void {
    this.galleryStore.delete(id);
  }

  onTabChange(tab: string): void {
    this.activeTab.set(tab);
  }

  onShowcase(): void {
    const project = this.projectStore.project();
    if (!project) return;
    this.projectStore.showcase(project.id);
  }

  onPublish(): void {
    const project = this.projectStore.project();
    if (!project) return;
    this.projectStore.publish(project.id);
  }

  icons = { Star, Eye, Users };
}
