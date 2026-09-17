import { api } from '@/shared/api/client'

export interface LoginRequest {
  email: string
  password: string
}

export type RegisterRequest = LoginRequest

export interface SessionUser {
  id: string
  role: string
}

export interface AuthUser extends SessionUser {
  email: string
}

interface ApiEnvelope<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
}

interface UserPayload<T> {
  user: T
}

function unwrapUser<T>(res: ApiEnvelope<UserPayload<T>> | UserPayload<T>): T {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as ApiEnvelope<UserPayload<T>>).data.user
  }
  return (res as UserPayload<T>).user
}

export function login(body: LoginRequest, signal?: AbortSignal): Promise<AuthUser> {
  return api
    .post<ApiEnvelope<UserPayload<AuthUser>> | UserPayload<AuthUser>>('/auth/login', body, { signal })
    .then(unwrapUser)
}

export function register(body: RegisterRequest, signal?: AbortSignal): Promise<AuthUser> {
  return api
    .post<ApiEnvelope<UserPayload<AuthUser>> | UserPayload<AuthUser>>('/auth/register', body, { signal })
    .then(unwrapUser)
}

export function getMe(signal?: AbortSignal): Promise<SessionUser> {
  return api
    .get<ApiEnvelope<UserPayload<SessionUser>> | UserPayload<SessionUser>>('/auth/me', undefined, { signal })
    .then(unwrapUser)
}

/** Alias kept for route-guard call sites. */
export const getSession = getMe

export function logout(signal?: AbortSignal): Promise<void> {
  return api.post<void>('/auth/logout', undefined, { signal })
}
