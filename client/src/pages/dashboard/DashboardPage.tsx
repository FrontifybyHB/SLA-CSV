import { CsvIngestPage } from './ingest'

/**
 * Protected dashboard entry (guarded by RequireAuth in App).
 * Full layout lives in ./ingest (code-split, component-per-file).
 */
export function DashboardPage() {
  return <CsvIngestPage />
}
