import { describe, expect, it, vi } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CsvUploadForm } from '@/features/datasets/components/CsvUploadForm'
import { renderWithProviders } from './render'

function fileInput(): HTMLInputElement {
  const input = document.querySelector('input[type="file"]')
  if (!(input instanceof HTMLInputElement)) throw new Error('file input not found')
  return input
}

function csv(name: string, content = 'agent_id,timestamp,status\nagent1,2025-01-15T10:00:00Z,UP\n'): File {
  return new File([content], name, { type: 'text/csv' })
}

describe('CsvUploadForm', () => {
  it('asks for files when uploading with an empty queue', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CsvUploadForm onUploaded={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /upload csv/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/choose one or more csv files/i)
  })

  it('queues multiple CSV files at once and offers a batch upload', async () => {
    const user = userEvent.setup()
    renderWithProviders(<CsvUploadForm onUploaded={vi.fn()} />)

    await user.upload(fileInput(), [csv('a.csv'), csv('b.csv'), csv('c.csv')])

    expect(await screen.findByRole('button', { name: /upload 3 csvs/i })).toBeInTheDocument()
    expect(screen.getByText('a.csv')).toBeInTheDocument()
    expect(screen.getByText('b.csv')).toBeInTheDocument()
    expect(screen.getByText('c.csv')).toBeInTheDocument()
  })

  it('flags non-CSV files in the queue', async () => {
    // applyAccept: false simulates the drag-and-drop path, which bypasses
    // the picker's accept filter (browsers only grey out, drop still fires).
    const user = userEvent.setup({ applyAccept: false })
    renderWithProviders(<CsvUploadForm onUploaded={vi.fn()} />)

    await user.upload(fileInput(), [new File(['x'], 'notes.txt', { type: 'text/plain' })])

    expect(await screen.findByText(/only \.csv files can be imported/i)).toBeInTheDocument()
  })
})
