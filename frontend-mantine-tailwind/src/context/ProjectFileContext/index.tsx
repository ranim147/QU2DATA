import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { useQuery } from "@apollo/client";
import { GET_FILES, GetFilesType, GetFilesVariables, ProjectFile } from "./query";
import { getLastProjectId, setLastProjectId } from "../../utils/lastProject";
import { setLastFileId } from "../../utils/lastFile";
import { useAuthContext } from "../AuthContext";

interface ProjectFilesContextValue {
  projectId: string | null;
  setProjectId: (projectId: string) => void;

  files: ProjectFile[];
  loadingFiles: boolean;
  refetchFiles: () => void;

  selectedFileId: string | null;
  selectFile: (fileId: string) => void;

  hasSelectedFile: boolean;
}

const ProjectFilesContext = createContext<ProjectFilesContextValue | null>(null);

export function ProjectFilesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuthContext();
  const isAuthenticated = Boolean(user);

  const [projectId, setProjectIdState] = useState<string | null>(null);
  const [selectedFileId, setSelectedFileIdState] = useState<string | null>(null);

  useEffect(() => {
    // Ne restaure le projet mémorisé que si l'utilisateur est connecté
    if (!isAuthenticated) return;

    const stored = getLastProjectId();
    if (stored) {
      setProjectIdState(stored);
    }
  }, [isAuthenticated]);

  const { data, loading, refetch } = useQuery<GetFilesType, GetFilesVariables>(
    GET_FILES,
    {
      variables: { filter: { projectId: projectId ?? "" }, page: 1, limit: 100 },
      // Ne jamais interroger le backend tant que l'utilisateur n'est pas authentifié
      skip: !projectId || !isAuthenticated,
      fetchPolicy: "cache-and-network",
    }
  );

  const files = data?.getFiles.rows ?? [];

  // Ne jamais restaurer automatiquement un fichier depuis le localStorage.
  // L'utilisateur doit cliquer explicitement sur un fichier pour le sélectionner —
  // c'est uniquement via selectFile() que selectedFileId est mis à jour.

  const setProjectId = useCallback((id: string) => {
    setLastProjectId(id);
    setProjectIdState(id);
    setSelectedFileIdState(null);
  }, []);

  const selectFile = useCallback((fileId: string) => {
    setLastFileId(fileId);
    setSelectedFileIdState(fileId);
  }, []);

  const refetchFiles = useCallback(() => {
    refetch();
  }, [refetch]);

  const value: ProjectFilesContextValue = {
    projectId,
    setProjectId,
    files,
    loadingFiles: loading,
    refetchFiles,
    selectedFileId,
    selectFile,
    hasSelectedFile: Boolean(selectedFileId),
  };

  return (
    <ProjectFilesContext.Provider value={value}>
      {children}
    </ProjectFilesContext.Provider>
  );
}

export function useProjectFiles() {
  const ctx = useContext(ProjectFilesContext);
  if (!ctx) {
    throw new Error(
      "useProjectFiles must be used within a ProjectFilesProvider"
    );
  }
  return ctx;
}