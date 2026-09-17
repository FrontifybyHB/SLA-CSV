import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_BYTES } from './upload.types'

type UploadValidation = { ok: true } | { ok: false; message: string }

export function validateUploadFile(file: File | null): UploadValidation {
  if (!file) {
    return { ok: false, message: 'Choose a CSV file to upload.' }
  }
  const lower = file.name.toLowerCase()
  if (!ALLOWED_UPLOAD_EXTENSIONS.some((extension) => lower.endsWith(extension))) {
    return { ok: false, message: 'Only .csv files can be imported.' }
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { ok: false, message: 'File is larger than the 5 MB limit.' }
  }
  return { ok: true }
}