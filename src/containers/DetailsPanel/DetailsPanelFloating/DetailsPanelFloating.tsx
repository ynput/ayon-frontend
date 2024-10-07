import { FC, useEffect, useMemo, useState } from 'react'
import * as Styled from './DetailsPanelFloating.styled'
import { Status } from '@api/rest/project'
import getThumbnails from '../helpers/getThumbnails'
import StackedThumbnails from '@pages/EditorPage/StackedThumbnails'
import { upperFirst } from 'lodash'
import { AssigneeField, StatusSelect } from '@ynput/ayon-react-components'
import Feed from '@containers/Feed/Feed'

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
}

export interface DetailsPanelFloatingProps {
  entities: Entity[]
  entityType: string
  statusesOptions: Status[]
  assignees: { name: string; label: string }[]
  projectName: string
  users: { name: string; label: string }[]
  scope: string
  statePath: string
  id: string // identifier for the floating panel
}

const DetailsPanelFloating: FC<DetailsPanelFloatingProps> = (props) => {
  // this ensures as the props change, the initial props don't
  const [initialProps, setInitialProps] = useState(props)
  const { entities, entityType, statusesOptions, projectName, users, scope, statePath } =
    initialProps

  // when id changes, update the initial props
  useEffect(() => {
    setInitialProps(props)
  }, [props.id])

  const thumbnails = useMemo(() => getThumbnails(entities, entityType), [entities, entityType])

  const isMultiple = entities.length > 1
  const firstEntity = entities[0]

  // for selected entities, get flat list of assignees
  const entityAssignees = useMemo(() => {
    const allEntityUsers = entities.flatMap((entity) => entity.users)
    return users.filter((user) => allEntityUsers.some((entityUser) => entityUser === user.name))
  }, [entities, users])

  const statusesValue = useMemo(() => entities.map((t) => t.status), [entities])

  return (
    <Styled.Container onClick={() => console.log('test')}>
      <Styled.Header>
        <StackedThumbnails thumbnails={thumbnails} projectName={projectName} />
        <Styled.Content>
          <h2>{!isMultiple ? firstEntity?.title : `${entities.length} ${entityType}s selected`}</h2>
          <div className="sub-title">
            <span>{upperFirst(entityType)} - </span>
            <h3>{!isMultiple ? firstEntity?.subTitle : entities.map((t) => t.title).join(', ')}</h3>
          </div>
        </Styled.Content>
      </Styled.Header>
      <Styled.Row>
        <StatusSelect
          value={statusesValue}
          options={statusesOptions}
          invert
          disableOpen
          buttonStyle={{ pointerEvents: 'none' }}
        />
        <AssigneeField users={entityAssignees} style={{ pointerEvents: 'none' }} />
      </Styled.Row>
      <Styled.FeedContainer>
        <Feed
          entityType={entityType}
          entities={entities}
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
  )
}

export default DetailsPanelFloating
