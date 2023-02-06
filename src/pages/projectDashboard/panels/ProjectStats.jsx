import React from 'react'
import { toast } from 'react-toastify'
import DashboardPanel from './DashboardPanel'
import ListStatsTile from './ListStatsTile'
import { useGetProjectStatsQuery } from '/src/services/projectDashboard/getProjectStats'

const ProjectStats = ({ projectName }) => {
  const { data = {}, isLoading, isFetching, isError } = useGetProjectStatsQuery({ projectName })

  const { folders, subsets, tasks, versions, representations, workfiles } = data.counts || {}

  const loading = isLoading || isFetching

  // convert above to object
  const stats = {
    folders: { label: 'Folders', icon: 'folder', stat: folders },
    subsets: { label: 'Subsets', icon: 'inventory_2', stat: subsets },
    versions: { label: 'Versions', icon: 'layers', stat: versions },
    representations: { label: 'Representations', icon: 'view_in_ar', stat: representations },
    tasks: { label: 'Tasks', icon: 'check_circle', stat: tasks },
    workfiles: { label: 'Workfiles', icon: 'home_repair_service', stat: workfiles },
  }

  const statsOrder = ['folders', 'subsets', 'versions', 'representations', 'tasks', 'workfiles']

  const copyToClipboard = (id) => {
    const { stat } = stats[id]
    navigator.clipboard.writeText(stat)
    toast.info(`Copied ${stat} to clipboard`)
  }

  return (
    <DashboardPanel title="Project Stats" isError={isError}>
      {statsOrder.map((id) => {
        const { label, stat, icon } = stats[id]
        return (
          <ListStatsTile
            title={label}
            stat={stat}
            icon={icon}
            isLoading={loading}
            key={id}
            onClick={() => copyToClipboard(id)}
          />
        )
      })}
    </DashboardPanel>
  )
}

export default ProjectStats
