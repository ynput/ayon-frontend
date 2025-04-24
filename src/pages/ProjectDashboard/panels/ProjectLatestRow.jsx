import React from 'react'
import { useSelector } from 'react-redux'
import styled from 'styled-components'
import { useGetProjectDashboardActivityQuery } from '@queries/getProjectDashboard'
import { EntityCard } from '@ynput/ayon-react-components'
import { productTypes } from '@shared/util'

const GridStyled = styled.div`
  /* 1 row, 3 columns */
  /* columns minWidth 150px, max width 250px */
  display: grid;
  position: relative;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  grid-template-rows: auto;
  grid-auto-rows: 0;
  overflow-y: clip;
  column-gap: var(--base-gap-large);

  /* span error message */
  & > span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`

const EntityCardStyled = styled(EntityCard)`
  &.isPlaceholder {
    &::after,
    .thumbnail::after,
    .tag::after {
      display: none;
    }

    opacity: 0.2;
    user-select: none;
    pointer-events: none;
    transition: opacity 0.3s;
  }

  .status {
    display: none;
  }
`

const ProjectLatestRow = ({
  projectName,
  entities,
  args = {},
  filter,
  isProjectLoading,
  rowIndex,
  onEntityClick,
}) => {
  const project = useSelector((state) => state.project)
  const { folders, tasks, statuses } = project
  // transform args object to graphql arguments string
  // {sortBy: "updatedAt", last: 4, statuses: ["On hold"]} => `sortBy: "updatedAt", last: 4, statuses: ["On hold"]`
  const argsString = Object.keys(args)
    .map((key) => `${key}: ${JSON.stringify(args[key])}`)
    .join(', ')

  let {
    data = [{}, {}, {}, {}],
    isLoading,
    isFetching,
  } = useGetProjectDashboardActivityQuery(
    {
      projectName,
      entities,
      args: argsString,
      name: 'Latest',
    },
    { skip: !projectName },
  )

  // use filter function to transform data if provided
  if (filter && typeof filter === 'function' && !isLoading && !isFetching) {
    data = filter([...data])
  }

  data = data.map((entity) => {
    let { type, icon, status } = entity
    let typeIcon = ''

    if (type === 'product' || type === 'version') {
      typeIcon = productTypes?.[icon]?.icon || 'help_center'
    } else if (type === 'folder') {
      typeIcon = folders?.[icon]?.icon
    } else if (type === 'task') {
      typeIcon = tasks?.[icon]?.icon
    }

    const statusIcon = statuses?.[status]?.icon
    const statusColor = statuses?.[status]?.color || 'white'

    return { ...entity, typeIcon, statusIcon, statusColor, projectName }
  })

  const isNoData = (!data || data.length === 0) && !isFetching && !isLoading
  //   if no data return 3 error tiles
  if (isNoData) {
    data = [
      {
        className: 'isPlaceholder',
      },
      {
        className: 'isPlaceholder',
      },
      {
        className: 'isPlaceholder',
      },
    ]
  }

  if (isProjectLoading || (data.length === 0 && !isNoData)) {
    data = [{}, {}, {}]
  }

  const isLoadingData = isLoading || isFetching || isProjectLoading || isNoData

  return (
    <GridStyled>
      {data.map(
        (entity, index) =>
          entity && (
            <EntityCardStyled
              key={`${rowIndex}-${index}`}
              title={entity.name}
              titleIcon={entity.typeIcon}
              imageIcon={entity.typeIcon}
              header={entity.footer}
              className={entity.className}
              imageUrl={
                !isLoadingData &&
                projectName &&
                entity.thumbnailId &&
                `/api/projects/${projectName}/${entity.thumbnailEntityType}s/${entity.thumbnailEntityId}/thumbnail?updatedAt=${entity.updatedAt}`
              }
              style={{
                minWidth: 'unset',
              }}
              isLoading={isLoadingData}
              loadingSections={['header', 'title']}
              onClick={() => onEntityClick(entity)}
            />
          ),
      )}
      {isNoData && <span>No Recent Data</span>}
    </GridStyled>
  )
}

export default ProjectLatestRow
