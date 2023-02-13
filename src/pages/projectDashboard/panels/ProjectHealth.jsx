import React from 'react'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ProgressTile from './ProgressTile'
import { useGetProjectAnatomyQuery } from '/src/services/project/getProject'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'
import { getStatusProps } from '/src/utils'
import copyToClipboard from '/src/helpers/copyToClipboard'

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

  const taskValues = [
    { value: onTrack, label: 'On Track' },
    { value: 100 - onTrack, label: 'Overdue', color: 'var(--color-hl-01)' },
  ]

  const statusValues = Object.entries(statuses).map(([key, value]) => ({
    value,
    label: key,
    color: getStatusProps(key, statusAnatomy).color,
  }))

  const percentageCopy = (v, suffix) => {
    const { value } = v
    const message = `${projectName}: ${value}% ${suffix}.`
    copyToClipboard(message)
  }

  const tasksCopy = (v, type) => {
    const { value, label } = v
    const message = `${projectName}: ${value} ${type} ${label}.`
    copyToClipboard(message)
  }

  return (
    <DashboardPanelWrapper title="Health" isError={isError}>
      <ProgressTile
        title={`${complete.percentage}% Complete`}
        subTitle={complete.subTitle}
        icon="schedule"
        values={[{ value: complete.percentage, label: 'Complete' }]}
        isLoading={isLoading}
        onProgressClick={(v) => percentageCopy(v, 'Project Complete')}
      />
      <ProgressTile
        title={`${storage.percentage}% Storage Full`}
        icon="database"
        values={[{ value: storage.percentage, label: 'Storage Used', color: storage.color }]}
        isLoading={isLoading}
        onProgressClick={(v) => percentageCopy(v, 'Storage Used')}
      />
      <ProgressTile
        title={`${overdue} Overdue Tasks`}
        subTitle={onTrack ? `${onTrack}% On track` : ''}
        icon="notification_important"
        values={taskValues}
        isLoading={isLoading}
        onProgressClick={(v) => tasksCopy(v, 'Tasks')}
      />
      {!!statusValues.length && (
        <ProgressTile
          title={'Statuses'}
          icon="check_circle"
          values={statusValues}
          isLoading={isLoading}
          onProgressClick={(v) => tasksCopy(v, 'Statuses')}
        />
      )}
    </DashboardPanelWrapper>
  )
}

export default ProjectHealth
