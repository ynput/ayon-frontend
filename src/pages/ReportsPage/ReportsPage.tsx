import { useLoadModule } from '@shared/hooks'
import { FC, useState, useEffect, useMemo } from 'react'
import ReportsFallback from './ReportsFallback'
import { AddonLoadingScreen, ProjectPageRemote } from '@shared/components'
import { useSlicerContext } from '@shared/containers'
import { useProjectFoldersContext } from '@shared/context'
import { RowSelectionState } from '@tanstack/react-table'

interface ReportsPageProps {
  projectName: string
}

const ReportsPage: FC<ReportsPageProps> = ({ projectName }) => {
  const [showLoading, setShowLoading] = useState(false)

  const [Reports, { isLoaded, outdated }] = useLoadModule({
    addon: 'reports',
    remote: 'reports',
    module: 'Reports',
    fallback: ReportsFallback,
    minVersion: '0.1.0-dev',
  })

  const { sliceType, pinnedSlice, setPinnedSlice, rowSelection } = useSlicerContext()
  const { getFolderById } = useProjectFoldersContext()

  // Build selection data from rowSelection using folder data from context
  const buildSelectionData = (selection: RowSelectionState) =>
    Object.keys(selection)
      .filter((id) => selection[id])
      .reduce<Record<string, { id: string; name?: string | null; label?: string | null }>>(
        (acc, id) => {
          const folder = getFolderById(id)
          acc[id] = { id, name: folder?.name, label: folder?.label || folder?.name }
          return acc
        },
        {},
      )

  const selectionData = useMemo(
    () => buildSelectionData(rowSelection),
    [rowSelection, getFolderById],
  )
  const pinnedSelectionData = useMemo(
    () => (pinnedSlice ? buildSelectionData(pinnedSlice.rowSelection) : null),
    [pinnedSlice, getFolderById],
  )

  useEffect(() => {
    if (!isLoaded) {
      const timer = setTimeout(() => setShowLoading(true), 200)
      return () => clearTimeout(timer)
    } else {
      setShowLoading(false)
    }
  }, [isLoaded])

  if (outdated) {
    return <div>Report requires Report addon 0.1.0 or higher</div>
  }

  if (!isLoaded && showLoading) {
    return <AddonLoadingScreen />
  }

  return (
    <ProjectPageRemote
      key={'reports'}
      Component={Reports}
      projectName={projectName}
      slicer={{ fields: ['hierarchy', 'assignees', 'status', 'taskType'] }}
      addonProps={{
        slicer: {
          selection: selectionData,
          type: sliceType,
          rowSelectionData: pinnedSelectionData,
          setPersistentRowSelectionData: () => setPinnedSlice(null),
        },
      }}
    />
  )
}

export default ReportsPage
