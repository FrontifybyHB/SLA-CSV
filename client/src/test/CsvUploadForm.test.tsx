import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CsvUploadForm } from '@/features/datasets/components/CsvUploadForm'
import { renderWithProviders } from './render'

describe('CsvUploadForm', () => {
  it('asks for a file when submitting with none selected', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CsvUploadForm onUploaded={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /upload csv/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/choose a csv file/i)
  })
})