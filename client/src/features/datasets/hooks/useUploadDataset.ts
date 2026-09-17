import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadDataset } from '../api/datasets.api'
import { datasetKeys } from '../api/datasets.keys'

export function useUploadDataset() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => uploadDataset(file),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: datasetKeys.list() })
    },
  })
}