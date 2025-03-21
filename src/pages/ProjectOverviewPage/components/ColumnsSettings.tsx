import { useProjectTableContext } from '@containers/ProjectTreeTable/context/ProjectTableContext'
import { FC, useMemo } from 'react'
import styled from 'styled-components'
import ColumnItem, { ColumnItemData } from './ColumnItem'

interface ColumnsSettingsProps {
  columns: ColumnItemData[]
}

const ColumnsSettings: FC<ColumnsSettingsProps> = ({ columns }) => {
  const { columnVisibility, setColumnVisibility, columnPinning, setColumnPinning } =
    useProjectTableContext()

  // Separate columns into visible and hidden
  const { visibleColumns, hiddenColumns } = useMemo(() => {
    const visible = columns.filter((col) => columnVisibility[col.value] !== false)
    const hidden = columns.filter((col) => columnVisibility[col.value] === false)

    return { visibleColumns: visible, hiddenColumns: hidden }
  }, [columns, columnVisibility])

  // Toggle column visibility
  const toggleVisibility = (columnId: string) => {
    const newState = { ...columnVisibility }
    // If column is currently visible, hide it
    if (newState[columnId] !== false) {
      newState[columnId] = false
    } else {
      // If column is currently hidden, show it
      newState[columnId] = true
    }
    setColumnVisibility(newState)
  }

  // Toggle column pinning
  const togglePinning = (columnId: string) => {
    const newState = { ...columnPinning }
    // If column is currently pinned, unpin it
    if (newState.left?.includes(columnId)) {
      newState.left = newState.left.filter((id) => id !== columnId)
    } else {
      // If column is currently unpinned, pin it
      newState.left = [...(newState.left || []), columnId]
    }
    setColumnPinning(newState)
  }

  return (
    <ColumnsContainer>
      <Section>
        <SectionTitle>Visible Columns</SectionTitle>
        <Menu>
          {visibleColumns.map((column) => (
            <ColumnItem
              key={column.value}
              column={column}
              isPinned={columnPinning.left?.includes(column.value) || false}
              isHidden={false}
              onTogglePinning={togglePinning}
              onToggleVisibility={toggleVisibility}
            />
          ))}
        </Menu>
      </Section>

      {hiddenColumns.length > 0 && (
        <Section>
          <SectionTitle>Hidden Columns</SectionTitle>
          <Menu>
            {hiddenColumns.map((column) => (
              <ColumnItem
                key={column.value}
                column={column}
                isPinned={columnPinning.left?.includes(column.value) || false}
                isHidden={true}
                onTogglePinning={togglePinning}
                onToggleVisibility={toggleVisibility}
              />
            ))}
          </Menu>
        </Section>
      )}
    </ColumnsContainer>
  )
}

// Styled components
const ColumnsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--base-gap-large);
  min-width: 250px;
  max-width: 350px;
`

const Section = styled.section`
  position: relative;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

const SectionTitle = styled.div`
  font-weight: 500;
  color: var(--md-sys-color-outline);
  padding: 4px 0;
`

const Menu = styled.ul`
  display: flex;
  flex-direction: column;
  list-style-type: none;
  margin: 0;
  padding: 0;
`

export default ColumnsSettings
