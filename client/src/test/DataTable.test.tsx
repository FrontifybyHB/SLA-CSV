import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '@/shared/ui/DataTable'
import { renderWithProviders } from './render'

interface Row {
  id: string
  name: string
  count: number
}

const rows: Row[] = [
  { id: 'a', name: 'alpha.csv', count: 10 },
  { id: 'b', name: 'beta.csv', count: 20 },
]

const columns = [
  { key: 'name', header: 'Dataset', render: (r: Row) => r.name },
  { key: 'count', header: 'Rows', align: 'right' as const, render: (r: Row) => r.count },
]

function ExpandHarness() {
  const [key, setKey] = useState<string | null>(null)
  return (
    <DataTable<Row>
      title="Inventory"
      columns={[
        ...columns,
        {
          key: 'action',
          header: 'Detail',
          render: (r: Row) => (
            <button type="button" onClick={() => setKey((k) => (k === r.id ? null : r.id))}>
              Toggle {r.id}
            </button>
          ),
        },
      ]}
      rows={rows}
      rowKey={(r) => r.id}
      expandedKey={key}
      renderExpanded={(r) => <div>Detail for {r.name}</div>}
    />
  )
}

describe('DataTable', () => {
  it('renders any columns and rows dynamically', () => {
    renderWithProviders(
      <DataTable<Row>
        title="Inventory"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
      />,
    )

    expect(screen.getByRole('columnheader', { name: 'Dataset' })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'Rows' })).toBeInTheDocument()
    expect(screen.getByText('alpha.csv')).toBeInTheDocument()
    expect(screen.getByText('beta.csv')).toBeInTheDocument()
  })

  it('shows the empty state when there are no rows', () => {
    renderWithProviders(
      <DataTable<Row>
        title="Inventory"
        columns={columns}
        rows={[]}
        rowKey={(r) => r.id}
        emptyTitle="No datasets yet."
      />,
    )

    expect(screen.getByText('No datasets yet.')).toBeInTheDocument()
  })

  it('expands a matching row with detail content', async () => {
    const user = userEvent.setup()
    renderWithProviders(<ExpandHarness />)

    expect(screen.queryByText('Detail for alpha.csv')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Toggle a' }))
    expect(await screen.findByText('Detail for alpha.csv')).toBeInTheDocument()
  })
})
