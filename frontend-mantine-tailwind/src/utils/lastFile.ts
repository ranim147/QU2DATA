
const LAST_FILE_ID_KEY = "qu2data:lastFileId";

export function setLastFileId(fileId: string) {
  try {
    localStorage.setItem(LAST_FILE_ID_KEY, fileId);
  } catch {
    // localStorage 
  }
}

export function getLastFileId(): string | null {
  try {
    return localStorage.getItem(LAST_FILE_ID_KEY);
  } catch {
    return null;
  }
}
export function clearLastFileId() {
  try {
    localStorage.removeItem(LAST_FILE_ID_KEY);
  } catch {
    // localStorage unavailable
  }
}