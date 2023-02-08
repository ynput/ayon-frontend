import React from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ProgressTile from './ProgressTile'
import { useGetProjectAnatomyQuery } from '/src/services/getProject'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'
import { getStatusProps } from '/src/utils'

// format complete data
const getComplete = (completion) => {
  //   complete data
  let { ahead = 0, behind = 0, percentage = 0 } = completion

  // round percentage
  percentage = Math.round(percentage)
  // find days ahead total
  const status = ahead - behind
  // status negative = behind, positive = ahead
  let statusString = status > 0 ? 'Ahead' : 'Behind'
  let subTitle = ''
  // complete subTitle days behind/ahead
  if (status === 0) subTitle = 'On Schedule'
  else subTitle = `${Math.abs(status)} Days ${statusString}`

  return {
    percentage,
    subTitle,
  }
}

// format storage data
const getStorage = (storageUsage) => {
  //   storage data
  const { quota = 1, used = 0 } = storageUsage

  //   calculate percentage
  const percentage = Math.round((used / quota) * 100)

  //   percentage over 60 orange, over 80 red
  const color =
    percentage > 80 ? 'var(--color-hl-error)' : percentage > 60 ? 'var(--color-hl-01)' : null

  return { percentage, color }
}

const ProjectHealth = ({ projectName }) => {
  const {
    data = {},
    isLoading,
    isError,
  } = useGetProjectDashboardQuery({ projectName, panel: 'health' })

  // get project anatomy for project name for status
  const { data: anatomy } = useGetProjectAnatomyQuery({ projectName })

  let statusAnatomy = {}
  if (anatomy) {
    for (const stat of anatomy.statuses) {
      statusAnatomy[stat.name] = stat
    }
  }

  const { completion = {}, storageUsage = {}, tasks = {}, statuses = {} } = data

  //   format data to complete progress
  const complete = getComplete(completion)

  //   format storage data
  const storage = getStorage(storageUsage)

  const { overdue = 1, total = 1 } = tasks

  const onTrack = Math.round(((total - overdue) / total) * 100)

  const statusValues = Object.entries(statuses).map(([key, value]) => ({
    value,
    label: key,
    color: getStatusProps(key, statusAnatomy).color,
  }))

  //   log data
  console.log(data)

  return (
    <DashboardPanelWrapper title="Health" isError={isError}>
      <ProgressTile
        title={`${complete.percentage}% Complete`}
        subTitle={complete.subTitle}
        icon="schedule"
        values={[{ value: complete.percentage, label: 'Complete' }]}
        isLoading={isLoading}
      />
      <ProgressTile
        title={`${storage.percentage}% Storge Full`}
        icon="database"
        values={[{ value: storage.percentage, label: 'Full', color: storage.color }]}
        isLoading={isLoading}
      />
      <ProgressTile
        title={`${overdue} Overdue Tasks`}
        subTitle={`${onTrack}% On track`}
        icon="notification_important"
        values={[
          { value: onTrack, label: 'On Track' },
          { value: 100 - onTrack, label: 'Overdue', color: 'var(--color-hl-01)' },
        ]}
        isLoading={isLoading}
      />
      <ProgressTile
        title={'Statuses'}
        icon="check_circle"
        values={statusValues}
        isLoading={isLoading}
      />
    </DashboardPanelWrapper>
  )
}

export default ProjectHealth
