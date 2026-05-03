export function buildBrowseSearchUrl(scope, query) {
  const scopedQuery = encodeURIComponent((query ?? "").trim());
  return `/booster-browse?scope=${scope}&q=${scopedQuery}`;
}
