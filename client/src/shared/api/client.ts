import { request, type RequestControl } from './kernel'
import type { QueryValues } from './query-string'

const apiBase = (import.meta.env.VITE_API_BASE ?? '/api/v1').replace(/\/+$/, '')

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
    return request({
      method: 'POST',
      url: `${apiBase}${path}`,
      rawBody: file,
      headers: { 'content-type': 'text/csv', ...control?.headers },
      timeoutMs: control?.timeoutMs ?? DEFAULT_UPLOAD_TIMEOUT_MS,
      signal: control?.signal,
    })
  },
}