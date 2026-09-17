import { useSyncExternalStore } from 'react'
import {
  emptyDashboardSearch,
  parseDashboardSearch,
  serializeDashboardSearch,
  type DashboardSearchParams,
} from './dashboard-location'

type Listener = () => void

const listeners = new Set<Listener>()
let current: DashboardSearchParams = getInitial()

function getInitial(): DashboardSearchParams {
  if (typeof window === 'undefined') return emptyDashboardSearch
  return parseDashboardSearch(window.location.search)
}

function emit(): void {
  for (const listener of listeners) listener()
}

function onPopState(): void {
  if (typeof window === 'undefined') return
  current = parseDashboardSearch(window.location.search)
  emit()
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', onPopState)
  }
  return () => {
    listeners.delete(listener)
    if (typeof window !== 'undefined') {
      window.removeEventListener('popstate', onPopState)
    }
  }
}

function getSnapshot(): DashboardSearchParams {
  return current
}

function write(next: DashboardSearchParams, replace: boolean): void {
  if (typeof window === 'undefined') {
    current = next
    emit()
    return
  }
  const serialized = serializeDashboardSearch(next)
  const url = serialized ? `${window.location.pathname}${serialized}` : window.location.pathname
  if (replace) {
    window.history.replaceState(null, '', url)
  } else {
    window.history.pushState(null, '', url)
  }
  current = next
  emit()
}

export interface DashboardLocationResult {
  params: DashboardSearchParams
  setParams: (
    patch: Partial<DashboardSearchParams>,
    options?: { replace?: boolean },
  ) => void
}

export function useDashboardLocation(): DashboardLocationResult {
  useSyncExternalStore(subscribe, getSnapshot)

  return {
    params: current,
    setParams: (patch, options) => write({ ...current, ...patch }, options?.replace ?? false),
  }
}