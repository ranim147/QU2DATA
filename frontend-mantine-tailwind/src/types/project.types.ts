export interface Project {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  objective?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectUser {
  projectId: string;
  userId: string;
  isOwner: boolean;
}