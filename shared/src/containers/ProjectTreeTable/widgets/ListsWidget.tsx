import { FC, MouseEvent, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import clsx from 'clsx'
import { Chips, ChipValue } from '@shared/components/Chips/Chips'
import { CellEditingDialog } from '@shared/components/LinksManager/CellEditingDialog'
import {
  Container,
  Header,
  LinkItem,
  LinksList,
} from '@shared/components/LinksManager/LinksManager.styled'
import type {
  ListMembership,
  ListsMembershipEntityType,
} from '@shared/api/queries/entityLists/getListsMembership'
import { useEntityListsMembership } from '../hooks/useListsMembership'
import { useProjectTableContext } from '../context/project-table'
import { LIST_COLUMNS } from '../utils/listColumns'
import { EDIT_TRIGGER_CLASS, WidgetBaseProps } from './CellWidget'

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

const getListPath = (projectName: string, list: ListMembership) => {
  if (list.entityListType === 'generic') return `/projects/${projectName}/lists?list=${list.id}`
  if (list.entityListType === 'review-session')
    return `/projects/${projectName}/reviews?review=${list.id}`
  return undefined
}

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
  const { useNavigate = useNoNavigate } = useProjectTableContext()
  const navigate = useNavigate()
  const allLists = useEntityListsMembership(projectName, entityType, entityId)
  const column = LIST_COLUMNS[columnId]

  const lists = useMemo(
    () => allLists?.filter((list) => list.entityListType === column?.listType),
    [allLists, column],
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
      items.map(({ list, open }) => ({ label: list.label, tooltip: list.label, onClick: open })),
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

  if (!lists) return <LoadingChip className="loading" />
  if (!lists.length) return null

  return (
    <>
      <Chips values={chips} pt={{ chip: { className: EDIT_TRIGGER_CLASS } }} />
      {isEditing && (
        <CellEditingDialog isEditing={isEditing} anchorId={cellId} onClose={onCancelEdit}>
          {/* the portal still bubbles mousedown to the table cell, which would swallow the click */}
          <Container onMouseDown={(event) => event.stopPropagation()}>
            <Header>{column?.label}</Header>
            <LinksList>
              {items.map(({ list, open }) => (
                <LinkItem key={list.id} className={clsx({ clickable: !!open })} onClick={open}>
                  <span className="title">
                    <span className="label">{list.label}</span>
                  </span>
                </LinkItem>
              ))}
            </LinksList>
          </Container>
        </CellEditingDialog>
      )}
    </>
  )
}
