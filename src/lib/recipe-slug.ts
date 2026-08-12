export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/** id-suffixed slug (`vegan-thai-curry-42`) — the trailing id makes the route
 * resolvable by direct API lookup, the title prefix just makes the URL readable. */
export function buildRecipeSlug(id: number | string, title: string): string {
  const base = toSlug(title)
  return base ? `${base}-${id}` : String(id)
}

export function parseRecipeIdFromSlug(slug: string): number | null {
  const match = /(?:^|-)(\d+)$/.exec(slug)
  return match ? Number(match[1]) : null
}
