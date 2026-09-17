import { useQuery } from '@tanstack/react-query'
import { getDataset } from '../api/datasets.api'
import { datasetKeys } from '../api/datasets.keys'

export function useDataset(id: string | null) {
  return useQuery({
    queryKey: datasetKeys.detail(id ?? ''),
    queryFn: ({ signal }) => getDataset(id as string, signal),
    enabled: id !== null && id !== '',
    staleTime: Infinity,
  })
}