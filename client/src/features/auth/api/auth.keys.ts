export const authKeys = {
  /** Single session query shared by useSession/RequireAuth. */
  session: () => ['auth', 'me'] as const,
}
