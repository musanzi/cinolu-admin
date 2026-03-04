import type { IBase } from './base.model';
import { IDeliverable } from './delivrable.model';
import type { IProject } from './project.model';
import type { IUser } from './user.model';

export interface IPhase extends IBase {
  name: string;
  description: string;
  slug: string;
  started_at: string;
  ended_at: string;
  project: IProject;
  participations: IUser[];
  participationsCount?: number;
  mentors?: IUser[];
  deliverables: IDeliverable[];
}
