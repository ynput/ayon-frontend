import { FC, useMemo } from 'react'
import * as Styled from './DetailsPanelFloating.styled'
import getThumbnails from '../helpers/getThumbnails'
import StackedThumbnails from '@components/Thumbnail/StackedThumbnails'
import { upperFirst } from 'lodash'
import { AssigneeField, Icon } from '@ynput/ayon-react-components'
import PiPWrapper from '@context/pip/PiPWrapper'
import { useGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import { useAppSelector } from '@state/store'
import {
  useGetKanbanProjectUsersQuery,
  useGetProjectsInfoQuery,
} from '@queries/userDashboard/getUserDashboard'
import getAllProjectStatuses from '../helpers/getAllProjectsStatuses'
import FeedWrapper from '../FeedWrapper'

type Entity = {
  id: string
  name: string
  label: string
  title: string
  subTitle: string
  icon: string
  updatedAt: string
  entityType: string
  users: string[]
  tags: string[]
  status: string
  projectName: string
}

export interface DetailsPanelFloatingProps {}

const DetailsPanelFloating: FC<DetailsPanelFloatingProps> = () => {
  const { entities, entityType, scope, statePath } = useAppSelector((state) => state.details.pip)
  const isOpen = entities.length > 0 && !!entityType

  const projects: string[] = entities.map((e: any) => e.projectName)

  const { data: allUsers = [] } = useGetKanbanProjectUsersQuery({ projects }, { skip: !isOpen })

  const { data: projectsInfo = {}, isFetching: isFetchingInfo } = useGetProjectsInfoQuery(
    {
      projects: projects,
    },
    { skip: !isOpen },
  )

  // get all statuses from projects info, removing duplicate names
  const statuses = useMemo(
    () => getAllProjectStatuses(projectsInfo, projects),
    [projectsInfo, projects],
  )

  const { data = [], isFetching: isFetchingEntitiesDetails } = useGetEntitiesDetailsPanelQuery(
    { entityType, entities: entities, projectsInfo },
    {
      skip: !isOpen || isFetchingInfo,
    },
  )
  const entitiesData: Entity[] = data.filter((e: Entity | null) => !!e)

  const thumbnails = useMemo(
    () => getThumbnails(entitiesData, entityType),
    [entitiesData, entityType],
  )

  // users for assignee field, find in all users
  const users = useMemo(() => {
    return allUsers
      .filter((u) => entitiesData.some((e) => e?.users?.includes(u.name)))
      .map((u) => ({ ...u, avatarUrl: `/api/users/${u.name}/avatar` }))
  }, [allUsers, entities])

  const isMultiple = entitiesData.length > 1
  const firstEntity = entitiesData[0]
  if (!entitiesData.length || !firstEntity) return null

  if (isFetchingEntitiesDetails) return <div>Loading...</div>

  const projectName = firstEntity?.projectName

  // are there multiple statuses of different names?
  const mixedStatuses = entitiesData.some((e) => e?.status !== firstEntity?.status)
  const mixedStatus = {
    icon: 'question_mark',
    color: 'var(--md-sys-color-surface-container-highest)',
    name: 'Mixed statuses',
  }

  const statusAnatomy = mixedStatuses
    ? mixedStatus
    : statuses.find((s) => s.name === firstEntity?.status) || {
        icon: '',
        color: '',
        name: 'None',
      }

  return (
    <PiPWrapper>
      <Styled.Container>
        <Styled.Header>
          <StackedThumbnails thumbnails={thumbnails} projectName={projectName} />
          <Styled.Content>
            <h2>
              {!isMultiple ? firstEntity?.title : `${entitiesData.length} ${entityType}s selected`}
            </h2>
            <div className="sub-title">
              <span>{upperFirst(entityType)} - </span>
              <h3>
                {!isMultiple ? firstEntity?.subTitle : entitiesData.map((t) => t.title).join(', ')}
              </h3>
            </div>
          </Styled.Content>
        </Styled.Header>
        <Styled.Row>
          <Styled.Status style={{ backgroundColor: statusAnatomy?.color }}>
            {<Icon icon={statusAnatomy.icon || 'question_mark'} />}
            <span className="label">{statusAnatomy?.name}</span>
          </Styled.Status>
          <AssigneeField users={users} style={{ pointerEvents: 'none' }} />
        </Styled.Row>
        <Styled.FeedContainer>
          <FeedWrapper
            entityType={entityType}
            // @ts-ignore
            entities={entitiesData}
            activeUsers={[]}
            // selectedTasksProjects={{}}
            projectInfo={projectsInfo[projectName]}
            projectName={projectName}
            isMultiProjects={false}
            scope={scope}
            statePath={statePath}
            readOnly
            // @ts-ignore
            statuses={statuses}
          />
        </Styled.FeedContainer>
      </Styled.Container>
    </PiPWrapper>
  )
}

export default DetailsPanelFloating
