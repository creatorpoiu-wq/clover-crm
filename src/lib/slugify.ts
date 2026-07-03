export function slugifyName(name: string): string {
  if (!name) return 'client';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except space/dash
    .replace(/[\s_]+/g, '-')  // replace spaces/underscores with dash
    .replace(/-+/g, '-');      // collapse duplicate dashes
}
