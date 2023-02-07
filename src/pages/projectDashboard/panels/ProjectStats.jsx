import React from 'react'
import { useEffect } from 'react'
import { useState } from 'react'
import { toast } from 'react-toastify'
import DashboardPanelWrapper from './DashboardPanelWrapper'
import ListStatsTile from './ListStatsTile'
import { useGetProjectDashboardQuery } from '/src/services/getProjectDashboard'

const ProjectStats = ({ projectName }) => {
  const [counters, setCounters] = useState({})

  const {
    data = {},
    isLoading,
    isError,
  } = useGetProjectDashboardQuery({ projectName, panel: 'entities' })

  const { folders, subsets, tasks, versions, representations, workfiles } = data

  useEffect(() => {
    // when data loaded use a setInterval to count up to the actual number
    const intervals = 100
    let count = 0
    let interval
    if (!isLoading) {
      let tempCounters = {
        folders: 0,
        subsets: 0,
        tasks: 0,
        versions: 0,
        representations: 0,
        workfiles: 0,
      }

      interval = setInterval(() => {
        count++

        tempCounters = {
          folders: Math.round((folders / intervals) * count),
          subsets: Math.round((subsets / intervals) * count),
          tasks: Math.round((tasks / intervals) * count),
          versions: Math.round((versions / intervals) * count),
          representations: Math.round((representations / intervals) * count),
          workfiles: Math.round((workfiles / intervals) * count),
        }

        setCounters(tempCounters)
        if (count === intervals) {
          clearInterval(interval)
        }
      }, 5)
    }

    //   clear
    return () => {
      clearInterval(interval)
    }
  }, [isLoading, data])

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
    <DashboardPanelWrapper title="Project Stats" isError={isError}>
      {statsOrder.map((id) => {
        const { label, icon } = stats[id]

        return (
          <ListStatsTile
            title={label}
            stat={counters[id] || stats[id].stat}
            icon={icon}
            isLoading={isLoading}
            key={id}
            onClick={() => copyToClipboard(id)}
          />
        )
      })}
    </DashboardPanelWrapper>
  )
}

export default ProjectStats
