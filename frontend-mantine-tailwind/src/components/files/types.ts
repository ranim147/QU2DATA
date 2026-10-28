// Extensions affichées comme badges sous la zone de dépôt,
// purement indicatif — le vrai contrôle de format se fait côté backend/FastAPI
export const ACCEPTED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".json"];

// Taille max affichée à l'utilisateur (purement indicatif ici aussi)
export const MAX_FILE_SIZE_LABEL = "500 Mo";

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  projectId: string;
  createdAt: string;
}

export interface UploadResult {
  success: boolean;
  message: string;
  file: UploadedFile | null;
}

export interface ProjectFile {
  id: string;
  name: string | null;
  type: string | null;
  size: number | null;
  projectId: string | null;
  createdAt: string | null;
}

export interface FilesPage {
  rows: ProjectFile[];
  count: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetFilesByProjectData {
  getFilesByProject: FilesPage;
}

export interface GetFilesByProjectVariables {
  projectId: string;
  page?: number;
  limit?: number;
}
