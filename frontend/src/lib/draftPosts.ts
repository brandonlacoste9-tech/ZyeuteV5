export type DraftPost = {
  id: string;
  caption: string;
  savedAt: string;
  /** Optional preview object URL or note */
  note?: string;
};

const KEY = "zyeute_upload_drafts";

export function loadDrafts(): DraftPost[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DraftPost[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDrafts(drafts: DraftPost[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(drafts.slice(0, 20)));
  } catch {
    /* quota */
  }
}

export function addDraft(caption: string, note?: string): DraftPost {
  const d: DraftPost = {
    id: `draft-${Date.now()}`,
    caption,
    savedAt: new Date().toISOString(),
    note,
  };
  const next = [d, ...loadDrafts()].slice(0, 20);
  saveDrafts(next);
  return d;
}

export function removeDraft(id: string): void {
  saveDrafts(loadDrafts().filter((d) => d.id !== id));
}
