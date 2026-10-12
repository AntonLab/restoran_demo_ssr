export function cancelFailureText<S extends string>(
  labels: Record<S, string>,
  error: string,
  status?: S,
): string {
  if (!status) return error;
  return `${error.replace(/\.$/, "")}. Current status: ${labels[status]}.`;
}

export function pageHrefs<F extends { page: number }>(
  f: F,
  pageCount: number,
  base: string,
  serialize: (f: F) => string,
): { prev: string | null; next: string | null } {
  const href = (page: number) => {
    const query = serialize({ ...f, page });
    return query ? `${base}?${query}` : base;
  };
  return {
    prev: f.page > 1 ? href(Math.min(f.page - 1, pageCount)) : null,
    next: f.page < pageCount ? href(f.page + 1) : null,
  };
}
