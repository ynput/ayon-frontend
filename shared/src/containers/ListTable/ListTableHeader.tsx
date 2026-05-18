import { flexRender, Header, RowData } from '@tanstack/react-table'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import clsx from 'clsx'
import * as Styled from './ListTable.styled'
import { ColumnHeaderMenuUI, type ColumnMenuItemType } from '@shared/components'
import HeaderActionButton from '@shared/containers/ProjectTreeTable/components/HeaderActionButton'
import { useMenuContext } from '@shared/context'

interface SortableTHProps<TData> {
  header: Header<TData, any>
  enabled: boolean
  enableSorting?: boolean
}

export function SortableTHComponent<TData extends RowData>({
  header,
  enabled,
  enableSorting = false,
}: SortableTHProps<TData>) {
  const { attributes, listeners, setNodeRef, isDragging, transform, transition } = useSortable({
    id: header.id,
    data: { type: 'column' },
    disabled: !enabled,
  })

  const column = header.column
  const canSort = enableSorting && column.getCanSort()
  const isSorted = column.getIsSorted()
  const menuId = `list-table-menu-${header.id}`
  const { menuOpen } = useMenuContext()
  const isMenuOpen = menuOpen === menuId

  const sortMenuItems: ColumnMenuItemType[] = canSort
    ? [
        {
          id: 'sort-asc',
          label: 'Sort ascending',
          icon: 'sort',
          selected: isSorted === 'asc',
          onClick: () => column.toggleSorting(false),
        },
        {
          id: 'sort-desc',
          label: 'Sort descending',
          icon: 'sort',
          className: 'sort-desc-icon',
          selected: isSorted === 'desc',
          onClick: () => column.toggleSorting(true),
        },
      ]
    : []

  // Prevent drag from starting when clicking action buttons
  const preventDrag = {
    onPointerDown: (e: React.PointerEvent) => e.stopPropagation(),
    onMouseDown: (e: React.MouseEvent) => e.stopPropagation(),
  }

  return (
    <Styled.SortableTHStyled
      ref={setNodeRef}
      style={{
        width: header.getSize(),
        transform: CSS.Transform.toString(transform) ?? undefined,
        transition,
      }}
      className={clsx({ grab: enabled, dragging: isDragging, 'menu-open': isMenuOpen })}
      {...(enabled ? { ...attributes, ...listeners } : {})}
    >
      <Styled.THContent>
        {header.isPlaceholder
          ? null
          : flexRender(header.column.columnDef.header, header.getContext())}
      </Styled.THContent>
      {(sortMenuItems.length > 0 || canSort) && (
        <Styled.THActions {...preventDrag}>
          {sortMenuItems.length > 0 && (
            <ColumnHeaderMenuUI menuItems={sortMenuItems} menuId={menuId} className="header-menu" />
          )}
          {canSort && (
            <HeaderActionButton
              icon="sort"
              className={clsx('sort-button', { visible: !!isSorted })}
              style={{
                transform: isSorted === 'asc' ? 'rotate(180deg) scaleX(-1)' : 'none',
              }}
              onClick={column.getToggleSortingHandler()}
              selected={!!isSorted}
            />
          )}
        </Styled.THActions>
      )}
    </Styled.SortableTHStyled>
  )
}
