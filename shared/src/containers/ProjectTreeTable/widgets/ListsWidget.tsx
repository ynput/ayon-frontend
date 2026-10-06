import { FC } from 'react'
import styled from 'styled-components'
import { Chips, ChipValue } from '@shared/components/Chips/Chips'
import type {
  ListMembership,
  ListsMembershipEntityType,
} from '@shared/api/queries/entityLists/getListsMembership'
import { useEntityListsMembership } from '../hooks/useListsMembership'
import { useProjectTableContext } from '../context/project-table'

const LoadingChip = styled.span`
  height: 24px;
  width: 64px;
  border-radius: var(--border-radius-m);
`

export type ListsWidgetData = {
  entityId: string
  entityType: ListsMembershipEntityType
}

const LIST_TYPE_LABELS: Record<string, string> = {
  generic: 'List',
  'review-session': 'Review session',
}

const getListPath = (projectName: string, list: ListMembership) => {
  if (list.entityListType === 'generic') return `/projects/${projectName}/lists?list=${list.id}`
  if (list.entityListType === 'review-session')
    return `/projects/${projectName}/reviews?review=${list.id}`
  return undefined
}

const useNoNavigate = () => undefined

interface ListsWidgetProps {
  value?: ListsWidgetData
  projectName: string
}

export const ListsWidget: FC<ListsWidgetProps> = ({ value, projectName }) =>
  value ? <EntityListsChips {...value} projectName={projectName} /> : null

const EntityListsChips: FC<ListsWidgetData & { projectName: string }> = ({
  entityId,
  entityType,
  projectName,
}) => {
  const { useNavigate = useNoNavigate } = useProjectTableContext()
  const navigate = useNavigate()
  const lists = useEntityListsMembership(projectName, entityType, entityId)

  if (!lists) return <LoadingChip className="loading" />
  if (!lists.length) return null

  const chips: ChipValue[] = lists.map((list) => {
    const path = getListPath(projectName, list)
    return {
      label: list.label,
      tooltip: `${LIST_TYPE_LABELS[list.entityListType] || list.entityListType}: ${list.label}`,
      icon: list.entityListType === 'review-session' ? 'subscriptions' : undefined,
      onClick:
        path && navigate
          ? (event) => {
              event.stopPropagation()
              if (event.metaKey || event.ctrlKey) window.open(path, '_blank')
              else navigate(path)
            }
          : undefined,
    }
  })

  return <Chips values={chips} />
}
