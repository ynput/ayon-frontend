import { FC, MouseEvent, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { Chips, ChipValue } from '@shared/components/Chips/Chips'
import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import {
  Container,
  CountBadge,
  Header,
  LinkItem,
  LinksList,
} from '@shared/components/LinksManager/LinksManager.styled'
import type {
  ListMembership,
  ListsMembershipEntityType,
} from '@shared/api/queries/entityLists/getListsMembership'
import { getListIcon } from '@shared/util'
import { useEntityListsMembership } from '../hooks/useListsMembership'
import { useProjectTableContext } from '../context/project-table'
import { LIST_COLUMNS } from '../utils/listColumns'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'

const ListTags = styled(Chips)`
  .chip {
    position: relative;
  }

  .open-icon {
    position: absolute;
    top: 50%;
    right: 2px;
    transform: translateY(-50%);
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-high-hover);
    opacity: 0;
  }

  .chip:hover .open-icon {
    opacity: 1;
  }
`

const LoadError = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--md-sys-color-error);

  .icon {
    font-size: 18px;
  }
`

const LoadingChip = styled.span`
  height: 24px;
  width: 64px;
  border-radius: var(--border-radius-m);
`

export type ListsWidgetData = {
  entityId: string
  entityType: ListsMembershipEntityType
  columnId: string
}

// Opens the list at the entity's items: one `listItemId` param per item, as an entity can be in
// a list more than once. The list pages select and scroll to those items.
const getListPath = (projectName: string, list: ListMembership) => {
  const page =
    list.entityListType === 'generic'
      ? { path: 'lists', param: 'list' }
      : list.entityListType === 'review-session'
      ? { path: 'reviews', param: 'review' }
      : undefined
  if (!page) return undefined

  const params = new URLSearchParams({ [page.param]: list.id })
  for (const itemId of list.itemIds) params.append('listItemId', itemId)
  return `/projects/${projectName}/${page.path}?${params}`
}

// same count badge as the links cells
const ItemCount: FC<{ count: number }> = ({ count }) =>
  count > 1 ? (
    <CountBadge style={{ cursor: 'default', pointerEvents: 'none' }}>x{count}</CountBadge>
  ) : null

const useNoNavigate = () => undefined

interface ListsWidgetProps extends WidgetBaseProps {
  value?: ListsWidgetData
  projectName: string
  cellId: string
}

export const ListsWidget: FC<ListsWidgetProps> = ({ value, ...props }) =>
  value ? <EntityListsChips value={value} {...props} /> : null

const EntityListsChips: FC<ListsWidgetProps & { value: ListsWidgetData }> = ({
  value: { entityId, entityType, columnId },
  projectName,
  cellId,
  isEditing,
  onCancelEdit,
}) => {
  const { useNavigate = useNoNavigate, hiddenListIds } = useProjectTableContext()
  const navigate = useNavigate()
  const { lists: allLists, error } = useEntityListsMembership(projectName, entityType, entityId)
  const column = LIST_COLUMNS[columnId]

  const lists = useMemo(
    () =>
      allLists?.filter(
        (list) => list.entityListType === column?.listType && !hiddenListIds?.includes(list.id),
      ),
    [allLists, column, hiddenListIds],
  )

  const items = useMemo(
    () =>
      (lists || []).map((list) => {
        const path = getListPath(projectName, list)
        const open =
          path && navigate
            ? (event: MouseEvent) => {
                event.stopPropagation()
                if (event.metaKey || event.ctrlKey) window.open(path, '_blank')
                else navigate(path)
              }
            : undefined
        return { list, open }
      }),
    [lists, projectName, navigate],
  )

  const chips: ChipValue[] = useMemo(
    () =>
      items.map(({ list, open }) => ({
        label: list.label,
        tooltip: list.itemIds.length > 1 ? `${list.label} (x${list.itemIds.length})` : list.label,
        suffix: (
          <>
            <ItemCount count={list.itemIds.length} />
            {open && <Icon icon="open_in_new" className="open-icon" />}
          </>
        ),
        onClick: open,
      })),
    [items],
  )

  // the table ignores keys while a cell is editing and keeps focus on the cell
  useEffect(() => {
    if (!isEditing) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancelEdit?.()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing, onCancelEdit])

  if (error) {
    return (
      <LoadError data-tooltip={`Lists failed to load, sync to try again: ${error}`}>
        <Icon icon="error" />
        Failed to load
      </LoadError>
    )
  }
  if (!lists) return <LoadingChip className="loading" />
  if (!lists.length) return null

  return (
    <>
      <ListTags values={chips} pt={{ chip: { className: EDIT_TRIGGER_CLASS } }} />
      {isEditing && (
        <CellEditingDialog isEditing={isEditing} anchorId={cellId} onClose={onCancelEdit}>
          {/* the portal still bubbles mousedown to the table cell, which would swallow the click */}
          <Container onMouseDown={(event) => event.stopPropagation()}>
            <Header>{column?.label}</Header>
            <LinksList>
              {items.map(({ list, open }) => (
                <LinkItem key={list.id} className={clsx({ clickable: !!open })} onClick={open}>
                  <Icon icon={getListIcon({ entityListType: list.entityListType, entityType })} />
                  <span className="title">{list.label}</span>
                  <ItemCount count={list.itemIds.length} />
                </LinkItem>
              ))}
            </LinksList>
          </Container>
        </CellEditingDialog>
      )}
    </>
  )
}
