import { FC, useMemo } from 'react'
import * as Styled from './DetailsPanelFloating.styled'
import getThumbnails from '../helpers/getThumbnails'
import StackedThumbnails from '@pages/EditorPage/StackedThumbnails'
import { upperFirst } from 'lodash'
import { AssigneeField, StatusSelect } from '@ynput/ayon-react-components'
import Feed from '@containers/Feed/Feed'
import PiPWrapper from '@context/pip/PiPWrapper'
import { useGetEntitiesDetailsPanelQuery } from '@queries/entity/getEntityPanel'
import { useAppSelector } from '@state/store'
import { useGetProjectsInfoQuery } from '@queries/userDashboard/getUserDashboard'
import { useGetAllAssigneesQuery } from '@queries/user/getUsers'
import { Status } from '@api/rest/project'

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

  const projects: string[] = entities.map((e: any) => e.projectName)

  const { data: allUsers = [] } = useGetAllAssigneesQuery({})

  const { data: projectsInfo = {}, isFetching: isFetchingInfo } = useGetProjectsInfoQuery({
    projects: projects,
  })

  // get all statuses from projects info, removing duplicate names
  const statuses: Status[] = useMemo(() => {
    const statuses = projects
      .map((p) => projectsInfo[p]?.statuses)
      .flat()
      .filter(Boolean)
    const uniqueStatuses = new Map(statuses.map((status) => [status.name, status]))
    return Array.from(uniqueStatuses.values())
  }, [projects, projectsInfo])

  const { data = [], isFetching: isFetchingEntitiesDetails } = useGetEntitiesDetailsPanelQuery(
    { entityType, entities: entities, projectsInfo },
    {
      skip: !entities.length || isFetchingInfo,
    },
  )
  const entitiesData: Entity[] = data

  const thumbnails = useMemo(
    () => getThumbnails(entitiesData, entityType),
    [entitiesData, entityType],
  )

  // users for assignee field, find in all users
  const users = useMemo(() => {
    return allUsers
      .filter((u) => entitiesData.some((e) => e.users?.includes(u.name)))
      .map((u) => ({ ...u, avatarUrl: `/api/users/${u.name}/avatar` }))
  }, [allUsers, entities])

  const isMultiple = entitiesData.length > 1
  const firstEntity = entitiesData[0]
  const projectName = firstEntity?.projectName

  const statusesValue = useMemo(() => entitiesData.map((t) => t.status), [entitiesData])

  if (isFetchingEntitiesDetails) return <div>Loading...</div>

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
          <StatusSelect
            value={statusesValue}
            options={statuses}
            invert
            disableOpen
            buttonStyle={{ pointerEvents: 'none' }}
          />
          <AssigneeField users={users} style={{ pointerEvents: 'none' }} />
        </Styled.Row>
        <Styled.FeedContainer>
          <Feed
            entityType={entityType}
            entities={entitiesData}
            activeUsers={[]}
            // selectedTasksProjects={{}}
            // projectInfo={firstProjectInfo}
            projectName={projectName}
            isMultiProjects={false}
            scope={scope}
            statePath={statePath}
          />
        </Styled.FeedContainer>
      </Styled.Container>
    </PiPWrapper>
  )
}

export default DetailsPanelFloating
