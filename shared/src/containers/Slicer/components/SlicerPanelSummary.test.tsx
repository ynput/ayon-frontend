import { render } from '@testing-library/react'
import { describe, expect, test } from 'vitest'
import type { SimpleTableRow } from '@shared/containers/SimpleTable/SimpleTable.types'
import type { SliceMap } from '../types'
import SlicerPanelSummary from './SlicerPanelSummary'

const row = (data: Partial<SimpleTableRow> & { id: string }): SimpleTableRow => ({
  name: data.id,
  label: data.id,
  subRows: [],
  ...data,
  data: { id: data.id },
})

const sliceMap = (...rows: SimpleTableRow[]): SliceMap => new Map(rows.map((r) => [r.id, r]))

const selection = (...ids: string[]) => Object.fromEntries(ids.map((id) => [id, true]))

const chips = (container: HTMLElement) =>
  Array.from(container.querySelectorAll<HTMLElement>('[data-chip]'))

describe('SlicerPanelSummary', () => {
  test('a single selected value is shown with its label', () => {
    const { container } = render(
      <SlicerPanelSummary
        rowSelection={selection('done')}
        sliceMap={sliceMap(row({ id: 'done', label: 'Done', icon: 'check' }))}
      />,
    )
    expect(chips(container)).toHaveLength(1)
    expect(chips(container)[0]).toHaveTextContent('Done')
  })

  test('deselected rows are left out', () => {
    const { container } = render(
      <SlicerPanelSummary
        rowSelection={{ done: true, blocked: false }}
        sliceMap={sliceMap(row({ id: 'done', label: 'Done' }), row({ id: 'blocked' }))}
      />,
    )
    expect(chips(container)).toHaveLength(1)
  })

  test('more than one value drops the labels, like the search bar filters', () => {
    const { container } = render(
      <SlicerPanelSummary
        rowSelection={selection('done', 'wip')}
        sliceMap={sliceMap(
          row({ id: 'done', label: 'Done', icon: 'check' }),
          row({ id: 'wip', label: 'In progress', icon: 'timer' }),
        )}
      />,
    )
    expect(container).not.toHaveTextContent('Done')
    expect(container).not.toHaveTextContent('In progress')
    expect(chips(container)).toHaveLength(2)
  })

  test('a value with nothing to draw keeps its label instead of going blank', () => {
    const { container } = render(
      <SlicerPanelSummary
        rowSelection={selection('a', 'b')}
        sliceMap={sliceMap(row({ id: 'a', label: 'Alpha' }), row({ id: 'b', label: 'Beta' }))}
      />,
    )
    expect(container).toHaveTextContent('Alpha')
    expect(container).toHaveTextContent('Beta')
  })

  test('an assignee is drawn from the avatar the row carries as start content', () => {
    const { container } = render(
      <SlicerPanelSummary
        rowSelection={selection('user1', 'user2')}
        sliceMap={sliceMap(
          row({ id: 'user1', label: 'Jane', startContent: <span data-avatar /> }),
          row({ id: 'user2', label: 'John', startContent: <span data-avatar /> }),
        )}
      />,
    )
    expect(container.querySelectorAll('[data-avatar]')).toHaveLength(2)
    expect(container).not.toHaveTextContent('Jane')
  })

  test('ids that are no longer in the slice data are skipped', () => {
    const { container } = render(
      <SlicerPanelSummary
        rowSelection={selection('done', 'deleted')}
        sliceMap={sliceMap(row({ id: 'done', label: 'Done' }))}
      />,
    )
    expect(chips(container)).toHaveLength(1)
  })

  test('nothing selected renders no chips', () => {
    const { container } = render(<SlicerPanelSummary rowSelection={{}} sliceMap={sliceMap()} />)
    expect(chips(container)).toHaveLength(0)
  })

  test('chips past the edge of the header collapse into a +N', () => {
    const props = {
      rowSelection: selection('a', 'b', 'c'),
      sliceMap: sliceMap(
        row({ id: 'a', label: 'Alpha', icon: 'check' }),
        row({ id: 'b', label: 'Beta', icon: 'check' }),
        row({ id: 'c', label: 'Gamma', icon: 'check' }),
      ),
    }
    const { container, rerender } = render(<SlicerPanelSummary {...props} />)

    // jsdom does not lay anything out, so the geometry the summary measures is stubbed:
    // a 70px header holding 30px chips has room for one of them next to the +N
    const wrapper = container.firstElementChild as HTMLElement
    Object.defineProperty(wrapper, 'clientWidth', { value: 70, configurable: true })
    chips(container).forEach((chip, index) => {
      Object.defineProperty(chip, 'offsetWidth', { value: 30, configurable: true })
      Object.defineProperty(chip, 'offsetLeft', { value: index * 34, configurable: true })
    })

    rerender(<SlicerPanelSummary {...props} />)

    expect(chips(container)).toHaveLength(1)
    expect(container).toHaveTextContent('+2')
  })
})
