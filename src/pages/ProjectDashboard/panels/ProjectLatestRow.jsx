import React from 'react'
import { useSelector } from 'react-redux'
// import { Link } from 'react-router-dom'
import styled from 'styled-components'
import EntityGridTile from '/src/components/EntityGridTile'
import { useGetProjectDashboardActivityQuery } from '/src/services/getProjectDashboard'

const GridStyled = styled.div`
  /* 1 row, 3 columns */
  /* columns minWidth 150px, max width 250px */
  display: grid;
  position: relative;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  grid-template-rows: auto;
  grid-auto-rows: 0;
  overflow-y: clip;
  column-gap: 8px;

  /* span error message */
  & > span {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }
`

const ProjectLatestRow = ({
  projectName,
  entities,
  args = {},
  filter,
  isProjectLoading,
  rowIndex,
}) => {
  const project = useSelector((state) => state.project)
  const { productTypes, folders, tasks, statuses } = project
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
        isError: true,
      },
      {
        isError: true,
      },
      {
        isError: true,
      },
    ]
  }

  if (isProjectLoading || (data.length === 0 && !isNoData)) {
    data = [
      {
        isLoading: true,
      },
      {
        isLoading: true,
      },
      {
        isLoading: true,
      },
    ]
  }

  return (
    <GridStyled>
      {data.map((entity, index) => (
        // <Link
        //   key={`${entity.id}-${index}`}
        //   to={`/projects/${projectName}/browser?entity=${entity.id}&type=${entity.type}`}
        // >
        <EntityGridTile
          key={`${rowIndex}-${index}`}
          {...entity}
          subTitle={null}
          isError={isNoData}
          isLoading={isLoading || isFetching || !projectName || isProjectLoading}
        />
        // </Link>
      ))}
      {isNoData && <span>No Recent Data</span>}
    </GridStyled>
  )
}

export default ProjectLatestRow
