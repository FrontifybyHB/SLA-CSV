import { Component, type ErrorInfo, type ReactNode } from 'react'
import { getErrorMessage, getErrorRequestId } from '@/shared/api/api-error'
import { ErrorState } from '@/shared/ui/ErrorState'
import { logger } from '@/shared/lib/logger'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('Unexpected render failure', { error, componentStack: info.componentStack })
  }

  handleReset = (): void => {
    this.setState({ error: null })
  }

  render(): ReactNode {
    const { error } = this.state
    if (error) {
      return (
        <ErrorState
          message={getErrorMessage(error)}
          requestId={getErrorRequestId(error)}
          onRetry={this.handleReset}
        />
      )
    }
    return this.props.children
  }
}