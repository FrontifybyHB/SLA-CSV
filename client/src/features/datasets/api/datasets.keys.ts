export const datasetKeys = {
  list: () => ['datasets', 'list'] as const,
  detail: (id: string) => ['datasets', 'detail', id] as const,
}