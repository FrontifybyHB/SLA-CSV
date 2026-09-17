import { useQuery } from '@tanstack/react-query'
import { listDatasets } from '../api/datasets.api'
import { datasetKeys } from '../api/datasets.keys'

export function useDatasets() {
  return useQuery({
    queryKey: datasetKeys.list(),
    queryFn: ({ signal }) => listDatasets(signal),
    staleTime: 30_000,
  })
}