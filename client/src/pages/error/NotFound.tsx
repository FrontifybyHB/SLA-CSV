import { useNavigate } from 'react-router-dom'
import { ErrorScreen } from '@/shared/ui/ErrorScreen'

export function NotFound() {
  const navigate = useNavigate()
  return (
    <ErrorScreen
      title="Page not found"
      message="The page you're looking for doesn't exist or has been moved."
      statusCode={404}
      onRetry={() => navigate(-1)}
      retryLabel="Go back"
    />
  )
}
