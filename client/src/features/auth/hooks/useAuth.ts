import { useMutation, useQueryClient } from '@tanstack/react-query'
import { login, register, type LoginRequest, type RegisterRequest } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'
const AUTH_QUERY_KEY = authKeys.session()

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: LoginRequest) => login(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: RegisterRequest) => register(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEY })
    },
  })
}