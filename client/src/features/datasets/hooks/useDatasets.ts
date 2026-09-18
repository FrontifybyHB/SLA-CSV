import { useQuery } from '@tanstack/react-query'
import { listDatasets } from '../api/datasets.api'
import { datasetKeys } from '../api/datasets.keys'

export function useDatasets() {
  return useQuery({
    queryKey: datasetKeys.list(),
    queryFn: ({ signal }) => listDatasets(signal),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  })
}