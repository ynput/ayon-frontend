import { useCallback } from 'react'

type UseSectionMenuItemsProps = {
  onDelete?: (selectedIds: string[]) => void
  onExpand?: (selectedIds: string[]) => void
  onCollapse?: (selectedIds: string[]) => void
}

type BuildOptions = {
  command?: boolean
  dividers?: boolean
  hidden?: Record<string, boolean>
}

const useSectionMenuItems = ({ onDelete, onExpand, onCollapse }: UseSectionMenuItemsProps) => {


  return useCallback(
    (rowSelection: Record<string, boolean>, options: BuildOptions = {}) => {
      const selectedIds = Object.keys(rowSelection).filter((id) => rowSelection[id])
      const multipleSelected = selectedIds.length > 1
      const hasSelection = selectedIds.length > 0

      return [
        {
          label: 'Expand All',
          icon: 'unfold_more',
          command: () => onExpand?.(selectedIds),
          hidden: options.hidden?.['expand-all'] || multipleSelected || !hasSelection,
        },
        {
          label: 'Collapse All',
          icon: 'unfold_less',
          command: () => onCollapse?.(selectedIds),
          hidden: options.hidden?.['collapse-all'] || multipleSelected || !hasSelection,
        },
        {
          separator: !options.dividers,
        },
        {
          label: 'Delete',
          icon: 'delete',
          danger: true,
          command: () => onDelete?.(selectedIds),
          hidden: options.hidden?.['delete'] || !hasSelection,
        },
      ].filter((item) => !item.hidden)
    },
    [onDelete, onExpand, onCollapse],
  )
}

export default useSectionMenuItems
