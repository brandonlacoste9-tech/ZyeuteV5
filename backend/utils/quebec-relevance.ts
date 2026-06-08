const QUEBEC_TERMS = [
  "montreal",
  "montréal",
  "quebec",
  "québec",
  "quebecois",
  "québécois",
  "mtl",
  "laval",
  "vaudreuil",
  "sherbrooke",
  "gatineau",
  "vieuxquebec",
  "vieux-quebec",
  "poutine",
  "fleurdelis",
  "fleur-de-lis",
];

const QUEBEC_QUERY_HINTS = [
  "#montreal",
  "#quebec",
  "#laval",
  "#vaudreuil",
  "#sherbrooke",
  "quebec city",
  "montreal",
  "laval",
  "sherbrooke",
  "quebec",
  "quebecois",
  "mtl",
];

/** 0–10 relevance score for Quebec/geo content. */
export function scoreQuebecRelevance(text: string, query?: string): number {
  const lower = (text || "").toLowerCase();
  let score = 0;

  for (const term of QUEBEC_TERMS) {
    if (lower.includes(term)) score += 1;
  }

  if (query) {
    const q = query.toLowerCase().replace(/^#/, "");
    if (lower.includes(q)) score += 2;
    if (QUEBEC_QUERY_HINTS.some((h) => h.replace("#", "") === q)) score += 2;
  }

  return Math.min(score, 10);
}

/** Integer 0–100 for publications.quebec_score column. */
export function inferQuebecScoreFromText(text: string, query?: string): number {
  return scoreQuebecRelevance(text, query) * 10;
}

export function isQuebecQuery(query: string): boolean {
  const q = query.toLowerCase().trim();
  return QUEBEC_QUERY_HINTS.some(
    (h) => h === q || h.replace("#", "") === q.replace("#", ""),
  );
}
