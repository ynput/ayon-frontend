import { FC, useCallback, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter'

import type { OnAddToList } from '../hooks/useHierarchyContextMenuItems'
import type { SliceType } from '../types'
import { SliceTypeField } from '../types'
import { useSlicerContext } from '../context/SlicerContext'
import { useSlicerPanelHeights } from '../hooks/useSlicerSplitter'
import type { SlicerCountsSource } from '../hooks/useSlicerCounts'
import { usePowerpack } from '@shared/context/PowerpackContext'
import { useProjectFoldersContext } from '@shared/context/ProjectFoldersContext'
import { MoveEntityDialog } from '@shared/containers/MoveEntityDialog/MoveEntityDialog'
import type { MultiEntityMoveData, OpenMoveDialog } from '@shared/containers/MoveEntityDialog/types'
import SlicerPanel from './SlicerPanel'

export interface SlicerProps {
  sliceFields: SliceTypeField[]
  entityTypes?: string[] // entity types
  pinnedSliceType?: SliceType // when changing slice type, pinned the current slice
  countsSource?: SlicerCountsSource // entity + filter args for per-value count badges
  onAddToList?: OnAddToList
  enableSplit?: boolean // offer splitting into multiple stacked panels (license gated)
}

export const Slicer: FC<SlicerProps> = ({
  sliceFields = [],
  entityTypes = ['task'],
  pinnedSliceType,
  countsSource,
  onAddToList,
  enableSplit,
}) => {
  const { slices, page, setPanelExpanded, projectName } = useSlicerContext()
  const { powerLicense } = usePowerpack()

  const splitEnabled = !!enableSplit && powerLicense
  const visibleSlices = splitEnabled ? slices : slices.slice(0, 1)

  const [movingEntities, setMovingEntities] = useState<MultiEntityMoveData | null>(null)
  const openMoveDialog = useCallback<OpenMoveDialog>((data) => {
    setMovingEntities('entities' in data ? data : { entities: [data] })
  }, [])
  const closeMoveDialog = useCallback(() => {
    setMovingEntities(null)
  }, [])

  const { getParentFolderIds } = useProjectFoldersContext()

  const handleMoveComplete = useCallback(
    (folderId: string) => {
      const folderIdsToExpand = [folderId, ...getParentFolderIds(folderId)]
      setPanelExpanded('hierarchy', (expanded) =>
        typeof expanded === 'boolean'
          ? expanded
            ? expanded
            : Object.fromEntries(folderIdsToExpand.map((id) => [id, true]))
          : {
              ...expanded,
              ...Object.fromEntries(folderIdsToExpand.map((id) => [id, true])),
            },
      )
    },
    [getParentFolderIds, setPanelExpanded],
  )

  const [panelHeights, handlePanelResizeEnd] = useSlicerPanelHeights(page, visibleSlices.length)

  const panelProps = {
    sliceFields,
    entityTypes,
    pinnedSliceType,
    countsSource,
    onAddToList,
    openMoveDialog,
    splitEnabled,
  }

  return (
    <>
      {visibleSlices.length === 1 ? (
        <SlicerPanel panel={visibleSlices[0]} isPrimary showRemove={false} {...panelProps} />
      ) : (
        <Splitter
          layout="vertical"
          // remount so primereact picks up new panel sizes when the arrangement changes
          key={visibleSlices.map((s) => s.id).join('|')}
          onResizeEnd={handlePanelResizeEnd}
          style={{ width: '100%', height: '100%', overflow: 'hidden' }}
        >
          {visibleSlices.map((panel, index) => (
            <SplitterPanel key={panel.id} size={panelHeights[index]} minSize={10} style={{ overflow: 'hidden' }}>
              <SlicerPanel panel={panel} isPrimary={index === 0} showRemove {...panelProps} />
            </SplitterPanel>
          ))}
        </Splitter>
      )}
      <MoveEntityDialog
        projectName={projectName}
        movingEntities={movingEntities}
        onClose={closeMoveDialog}
        onMoveComplete={handleMoveComplete}
      />
    </>
  )
}
