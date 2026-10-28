const LAST_PROJECT_ID_KEY = "qu2data:lastProjectId";

export function setLastProjectId(projectId: string) {
  try {
    localStorage.setItem(LAST_PROJECT_ID_KEY, projectId);
  } catch {
    // localStorage unavailable
  }
}

export function getLastProjectId(): string | null {
  try {
    return localStorage.getItem(LAST_PROJECT_ID_KEY);
  } catch {
    return null;
  }
}
export function clearLastProjectId() {
  try {
    localStorage.removeItem(LAST_PROJECT_ID_KEY);
  } catch {
    // localStorage unavailable
  }
}

