import { getApiBase } from './api-base'
import { request, type RequestControl } from './kernel'
import type { QueryValues } from './query-string'

const apiBase = getApiBase()

const DEFAULT_GET_TIMEOUT_MS = 15_000
const DEFAULT_UPLOAD_TIMEOUT_MS = 60_000

export interface ApiClient {
  get<T>(path: string, query?: QueryValues, control?: RequestControl): Promise<T>
  post<T>(path: string, jsonBody?: unknown, control?: RequestControl): Promise<T>
  upload<T>(path: string, file: File, control?: RequestControl): Promise<T>
}

export const api: ApiClient = {
  get(path, query, control) {
    return request({
      method: 'GET',
      url: `${apiBase}${path}`,
      query,
      timeoutMs: control?.timeoutMs ?? DEFAULT_GET_TIMEOUT_MS,
      signal: control?.signal,
      headers: control?.headers,
    })
  },
  post(path, jsonBody, control) {
    return request({
      method: 'POST',
      url: `${apiBase}${path}`,
      jsonBody,
      timeoutMs: control?.timeoutMs ?? DEFAULT_GET_TIMEOUT_MS,
      signal: control?.signal,
      headers: control?.headers,
    })
  },
  upload(path, file, control) {
    // The server's file-upload guard requires a filename (query ?filename=
    // or x-filename header). Without it every upload is rejected with a 400
    // "A filename is required" — the first-call error users were seeing.
    const separator = path.includes('?') ? '&' : '?'
    return request({
      method: 'POST',
      url: `${apiBase}${path}${separator}filename=${encodeURIComponent(file.name)}`,
      rawBody: file,
      headers: {
        'content-type': 'text/csv',
        'x-filename': file.name,
        ...control?.headers,
      },
      timeoutMs: control?.timeoutMs ?? DEFAULT_UPLOAD_TIMEOUT_MS,
      signal: control?.signal,
    })
  },
}