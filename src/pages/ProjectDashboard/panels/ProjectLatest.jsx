import React, { Fragment } from 'react'
import { useSelector } from 'react-redux'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ProjectLatestRow from './ProjectLatestRow'
import { useGetProjectQuery } from '@queries/project/enhancedProject'

const ProjectLatest = ({ projectName }) => {
  // project
  const { isLoading, isFetching } = useGetProjectQuery({ projectName }, { skip: !projectName })
  // {Approved: {name: "Approved", state: "done"}, ...}}
  const statuses = useSelector((state) => state.project.statuses)
  // create an object of status states {done: ["Approved", "Omitted"], ...}
  const {
    blocked = [],
    done = [],
    in_progress = [],
    not_started = [],
  } = Object.values(statuses).reduce((acc, status) => {
    if (!acc[status.state]) {
      acc[status.state] = []
    }
    acc[status.state].push(status.name)
    return acc
  }, {})

  const rows = [
    {
      title: 'Latest',
      entities: ['folder', 'product', 'version', 'task'],
      args: {
        sortBy: 'updatedAt',
        last: 2,
      },
      filter: (data) =>
        data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).splice(0, 4),
    },
    {
      title: 'Recently Approved',
      entities: ['folder', 'product', 'version', 'task'],
      args: {
        sortBy: 'updatedAt',
        last: 2,
        statuses: done,
      },
      filter: (data) =>
        data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).splice(0, 4),
    },
    {
      title: 'Urgent',
      entities: ['folder', 'product', 'version', 'task'],
      args: {
        sortBy: 'attrib.endDate',
        first: 2,
        statuses: [...in_progress, ...blocked, ...not_started],
      },
      filter: (data) =>
        data.sort((a, b) => new Date(a.updatedAt) - new Date(b.updatedAt)).splice(0, 4),
    },
    {
      title: 'New Versions',
      entities: ['version'],
      args: {
        sortBy: 'createdAt',
        first: 4,
      },
      filter: (data) => data.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)),
    },
  ]

  return (
    <DashboardPanelWrapper
      title="Activity"
      icon={{
        link: '/events',
        icon: 'history',
        tooltip: 'Events page',
      }}
    >
      {rows.map((row, i) => (
        <Fragment key={i}>
          <h2>{row.title}</h2>
          <ProjectLatestRow
            projectName={!isLoading && projectName}
            entities={row.entities}
            args={row.args}
            filter={row.filter}
            isProjectLoading={isLoading || isFetching}
            rowIndex={i}
          />
        </Fragment>
      ))}
    </DashboardPanelWrapper>
  )
}

export default ProjectLatest
