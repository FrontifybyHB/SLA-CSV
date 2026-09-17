import { useQuery } from '@tanstack/react-query'
import { getSession } from '../api/auth.api'
import { authKeys } from '../api/auth.keys'

/**
 * Session probe for route guarding.
 *
 * Auth cookies are httpOnly, so JS cannot read the access/refresh tokens
 * directly. Instead we ask the server who we are: 200 = authenticated,
 * 401 = no (or expired + unrefreshable) session. The shared API kernel
 * already attempts a single refresh on ACCESS_TOKEN_EXPIRED before
 * surfacing a 401, so a 401 here genuinely means "go log in".
 */
export function useSession(enabled = true) {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: ({ signal }) => getSession(signal),
    enabled,
    staleTime: 60_000,
    retry: false,
  })
}
