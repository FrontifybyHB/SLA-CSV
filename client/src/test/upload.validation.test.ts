import { describe, expect, it } from 'vitest'
import { validateUploadFile } from '@/features/datasets/model/upload.validation'
import { MAX_UPLOAD_BYTES } from '@/features/datasets/model/upload.types'
import { csvFile } from './fixtures'

describe('validateUploadFile()', () => {
  it('rejects a missing file', () => {
    expect(validateUploadFile(null)).toEqual({
      ok: false,
      message: 'Choose a CSV file to upload.',
    })
  })

  it('rejects a non-csv extension', () => {
    const file = new File(['x'], 'notes.txt', { type: 'text/plain' })
    const result = validateUploadFile(file)
    expect(result.ok).toBe(false)
  })

  it('rejects a file beyond the size limit', () => {
    const file = csvFile('a,b')
    Object.defineProperty(file, 'size', { value: MAX_UPLOAD_BYTES + 1 })
    const result = validateUploadFile(file)
    expect(result).toEqual({ ok: false, message: 'File is larger than the 5 MB limit.' })
  })

  it('accepts a csv file within the limit', () => {
    expect(validateUploadFile(csvFile('a,b'))).toEqual({ ok: true })
  })
})