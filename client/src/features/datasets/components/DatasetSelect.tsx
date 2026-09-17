import { useDatasets } from '../hooks/useDatasets'
import { Field } from '@/shared/ui/Field'
import { Select } from '@/shared/ui/Select'
import { EmptyState } from '@/shared/ui/EmptyState'
import { ErrorState } from '@/shared/ui/ErrorState'
import { Skeleton } from '@/shared/ui/Skeleton'

export interface DatasetSelectProps {
  id?: string
  label?: string
  value: string | null
  onChange: (datasetId: string) => void
  disabled?: boolean
  hint?: string
}

export function DatasetSelect({
  id = 'dataset-select',
  label = 'Dataset',
  value,
  onChange,
  disabled = false,
  hint,
}: DatasetSelectProps) {
  const { data, isPending, isError, refetch } = useDatasets()

  if (isPending) {
    return <Skeleton className="select" />
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load datasets."
        message="The dataset list is unavailable right now."
        onRetry={() => void refetch()}
        retryLabel="Retry"
      />
    )
  }

  const datasets = data ?? []

  if (datasets.length === 0) {
    return (
      <EmptyState title="No datasets yet." description="Upload a CSV to create the first one." />
    )
  }

  return (
    <Field htmlFor={id} label={label} hint={hint}>
      <Select
        id={id}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Select a dataset…</option>
        {datasets.map((dataset) => (
          <option key={dataset.datasetId} value={dataset.datasetId}>
            {dataset.filename}
          </option>
        ))}
      </Select>
    </Field>
  )
}