import { FC, useMemo, useState } from 'react'
import * as Styled from './DetailsPanelFloating.styled'
import getThumbnails from '../helpers/getThumbnails'
import { StackedThumbnails } from '@shared/components'
import { upperFirst } from 'lodash'
import { AssigneeField, getTextColor, Icon } from '@ynput/ayon-react-components'
import { PiPWrapper, usePowerpack, DetailsPanelTab, useScopedDetailsPanel } from '@shared/context'
import { useGetEntitiesDetailsPanelQuery } from '@shared/api'
import { useGetKanbanProjectUsersQuery, useGetProjectsInfoQuery } from '@shared/api'
import getAllProjectStatuses from '../helpers/getAllProjectsStatuses'
import FeedWrapper from '../FeedWrapper'
import mergeProjectInfo from '../helpers/mergeProjectInfo'
import { buildDetailsPanelTitles } from '../helpers/buildDetailsPanelTitles'
import { productTypes} from '@shared/util'
import { useDetailsPanelContext } from '@shared/context'

export interface DetailsPanelFloatingProps {}

export const DetailsPanelFloating: FC<DetailsPanelFloatingProps> = () => {
  const { pip } = useDetailsPanelContext()
  const entityType = pip?.entityType
  const entities = pip?.entities || []
  const scope = pip?.scope || ''
  const isOpen = entities.length > 0 && !!entityType
  const { currentTab: parentTab } = useScopedDetailsPanel(scope)
  const [currentTab, setCurrentTab] = useState<DetailsPanelTab>(parentTab)

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

  const { data: entitiesData = [], isFetching: isFetchingEntitiesDetails } =
    useGetEntitiesDetailsPanelQuery(
      // @ts-expect-error
      { entityType: entityType, entities: entities },
      {
        skip: !isOpen || isFetchingInfo,
      },
    )

  // reduce projectsInfo to selected projects and into one
  const projectInfo = useMemo(
    () => mergeProjectInfo(projectsInfo, projects),
    [projectsInfo, projects],
  )

  // build icons for entity types
  const entityTypeIcons = useMemo(
    () => ({
      task: projectInfo.taskTypes
        .filter((task) => !!task.icon)
        .reduce((acc, task) => ({ ...acc, [task.name]: task.icon }), {}),
      folder: projectInfo.folderTypes
        .filter((folder) => !!folder.icon)
        .reduce((acc, folder) => ({ ...acc, [folder.name]: folder.icon }), {}),
      product: Object.entries(productTypes).reduce(
        (acc, [key, product]) => ({ ...acc, [key]: product.icon }),
        {},
      ),
    }),
    [projectInfo],
  )

  const thumbnails = useMemo(
    () => (entityType ? getThumbnails(entitiesData, entityType, entityTypeIcons) : []),
    [entitiesData, entityType],
  )

  // users for assignee field, find in all users
  const users = useMemo(() => {
    return allUsers
      .filter((u) => entitiesData.some((e) => e?.task?.assignees?.includes(u.name)))
      .map((u) => ({ ...u, avatarUrl: `/api/users/${u.name}/avatar` }))
  }, [allUsers, entities])

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

  if (!entityType) return null

  // Get title and subtitle from the imported function
  const { title, subTitle } = buildDetailsPanelTitles(entitiesData, entityType)

  return (
    <PiPWrapper>
      <Styled.Container>
        <Styled.Header>
          <StackedThumbnails thumbnails={thumbnails} />
          <Styled.Content>
            <h2>{title}</h2>
            <div className="sub-title">
              <span>{upperFirst(entityType)} - </span>
              <h3>{subTitle}</h3>
            </div>
          </Styled.Content>
        </Styled.Header>
        <Styled.Row>
          <Styled.Status style={{ backgroundColor: statusAnatomy?.color, color: getTextColor(statusAnatomy?.color) }}>
            <Icon icon={statusAnatomy.icon || 'question_mark'} style={{ color: 'inherit' }} />
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
            disabled={false}
            scope={scope}
            readOnly
            // @ts-ignore
            statuses={statuses}
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
          />
        </Styled.FeedContainer>
      </Styled.Container>
    </PiPWrapper>
  )
}

export default DetailsPanelFloating
