import { useEffect } from "react";

/**
 * Petit hook utilitaire: quand autoGenerate=true, on exécute automatiquement
 * la mutation de génération dès que possible.
 */
export function useAutoGenerateFlag({
  fileId,
  autoGenerate,
  generating,
  generateReport,
  refetch,
}: {
  fileId: string;
  autoGenerate?: boolean;
  generating: boolean;
  generateReport: (vars: { fileId: string }) => Promise<any>;
  refetch: () => Promise<any> | void;
}) {
  useEffect(() => {
    if (!autoGenerate) return;
    if (!fileId) return;
    if (generating) return;

    // Génération + refresh du query
    generateReport({ fileId }).then(() => refetch());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, fileId]);
}

