import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { Spinner } from '@/shared/ui/Spinner'
import { getErrorMessage } from '@/shared/api/api-error'
import { useUploadDataset } from '../hooks/useUploadDataset'
import { validateUploadFile } from '../model/upload.validation'
import type { UploadResult } from '../model/upload.types'

export interface CsvUploadFormProps {
  onUploaded: (result: UploadResult) => void
}

export function CsvUploadForm({ onUploaded }: CsvUploadFormProps) {
  const upload = useUploadDataset()
  const inputId = 'csv-upload-input'
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fieldError, setFieldError] = useState<string | undefined>(undefined)

  function handleFileChange(file: File | null) {
    setSelectedFile(file)
    if (fieldError) setFieldError(undefined)
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const file = selectedFile
    const validation = validateUploadFile(file)
    if (!file || !validation.ok) {
      setFieldError(validation.ok ? 'Choose a CSV file to upload.' : validation.message)
      return
    }
    setFieldError(undefined)
    upload.mutate(file, {
      onSuccess: (result) => {
        setSelectedFile(null)
        if (inputRef.current) inputRef.current.value = ''
        onUploaded(result)
      },
    })
  }

  const submitLabel = upload.isPending ? 'Uploading and processing…' : 'Upload CSV'

  return (
    <form onSubmit={handleSubmit} className="csv-upload" noValidate>
      <Field
        htmlFor={inputId}
        label="CSV file"
        hint="Raw check CSV. Sent as-is to the server for parsing and import."
        error={fieldError}
      >
        <Input
          id={inputId}
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          disabled={upload.isPending}
          invalid={Boolean(fieldError)}
          onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
        />
      </Field>

      <div className="csv-upload__actions">
        <Button type="submit" pending={upload.isPending}>
          {upload.isPending ? <Spinner /> : null}
          {submitLabel}
        </Button>
      </div>

      {upload.isError ? (
        <p className="csv-upload__error" role="alert">
          {getErrorMessage(upload.error)}
        </p>
      ) : null}
    </form>
  )
}