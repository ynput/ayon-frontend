import { FC, useCallback, useEffect, useRef, useState } from 'react'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import styled from 'styled-components'

import type { OnAddToList } from '../hooks/useHierarchyContextMenuItems'
import type { SliceType } from '../types'
import { SliceTypeField } from '../types'
import { useSlicerContext } from '../context/SlicerContext'
import { useSlicerPanelHeights } from '../hooks/useSlicerSplitter'
import type { GetSlicerCountsSource, SlicerCountsSource } from '../hooks/useSlicerCounts'
import { usePowerpack } from '@shared/context/PowerpackContext'
import { useProjectFoldersContext } from '@shared/context/ProjectFoldersContext'
import { MoveEntityDialog } from '@shared/containers/MoveEntityDialog/MoveEntityDialog'
import type { MultiEntityMoveData, OpenMoveDialog } from '@shared/containers/MoveEntityDialog/types'
import SlicerPanel from './SlicerPanel'
import { SLICER_MIN_PANEL_HEIGHT } from '../hooks/slicerPanelLayout'

// the splitter only puts gutters between panels, so the last one gets its own
const BottomGutter = styled.div`
  height: 4px;
  cursor: row-resize;
  background-color: var(--md-sys-color-surface-container);
  user-select: none;
  touch-action: none;

  &:hover,
  &:focus-visible {
    background-color: var(--md-sys-color-surface-container-highest);
    outline: none;
  }
`

const KEYBOARD_RESIZE_STEP = 24

export interface SlicerProps {
  sliceFields: SliceTypeField[]
  entityTypes?: string[] // entity types
  pinnedSliceType?: SliceType // when changing slice type, pinned the current slice
  // entity + filter args for per-value count badges; function form resolves per panel
  countsSource?: SlicerCountsSource | GetSlicerCountsSource
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
  const { slices, page, setPanelExpanded, projectName, collapsedPanels } = useSlicerContext()
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

  const stackRef = useRef<HTMLDivElement>(null)
  const [columnHeight, setColumnHeight] = useState(0)
  useEffect(() => {
    const el = stackRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => setColumnHeight(entry.contentRect.height))
    observer.observe(el)
    return () => observer.disconnect()
  }, [visibleSlices.length])

  const panelIds = visibleSlices.map((panel) => panel.id)
  // a lone panel must not collapse: there would be nothing left of the slicer
  const canCollapse = visibleSlices.length > 1
  const {
    sizes: panelSizes,
    minSize,
    height: stackTotalHeight,
    layoutKey,
    panelHeights,
    setPanelHeight,
    handleResizeEnd: handlePanelResizeEnd,
  } = useSlicerPanelHeights(page, panelIds, canCollapse ? collapsedPanels : [], columnHeight)

  const lastPanelId = panelIds[panelIds.length - 1]
  const lastPanelCollapsed = canCollapse && collapsedPanels.includes(lastPanelId)
  const handleLastPanelResize = (event: React.PointerEvent<HTMLDivElement>) => {
    // without this the browser starts a native drag and the pointerup never arrives,
    // which would leave the move handler running over the whole page
    event.preventDefault()
    const gutter = event.currentTarget
    const startY = event.clientY
    const startHeight = panelHeights[panelHeights.length - 1] ?? SLICER_MIN_PANEL_HEIGHT

    const onMove = (moveEvent: PointerEvent) =>
      setPanelHeight(lastPanelId, startHeight + moveEvent.clientY - startY)
    const onEnd = () => {
      gutter.removeEventListener('pointermove', onMove)
      gutter.removeEventListener('pointerup', onEnd)
      gutter.removeEventListener('pointercancel', onEnd)
      gutter.removeEventListener('lostpointercapture', onEnd)
    }

    gutter.setPointerCapture(event.pointerId)
    gutter.addEventListener('pointermove', onMove)
    gutter.addEventListener('pointerup', onEnd)
    gutter.addEventListener('pointercancel', onEnd)
    gutter.addEventListener('lostpointercapture', onEnd)
  }

  const handleLastPanelKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const step = event.key === 'ArrowUp' ? -KEYBOARD_RESIZE_STEP : KEYBOARD_RESIZE_STEP
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
    event.preventDefault()
    setPanelHeight(lastPanelId, (panelHeights[panelHeights.length - 1] ?? 0) + step)
  }

  const [searchByPanel, setSearchByPanel] = useState<Record<string, string>>({})
  const handleSearchChange = useCallback(
    (panelId: string, value: string) => setSearchByPanel((prev) => ({ ...prev, [panelId]: value })),
    [],
  )
  // a removed panel must not hand its search text to the next panel of the same type
  const panelIdKey = panelIds.join('|')
  useEffect(() => {
    setSearchByPanel((prev) => {
      const kept = Object.keys(prev).filter((id) => panelIds.includes(id))
      if (kept.length === Object.keys(prev).length) return prev
      return Object.fromEntries(kept.map((id) => [id, prev[id]]))
    })
  }, [panelIdKey])

  const panelProps = {
    visibleSlices,
    canCollapse,
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
        <SlicerPanel
          panel={visibleSlices[0]}
          isPrimary
          showRemove={false}
          search={searchByPanel[visibleSlices[0].id] ?? ''}
          onSearchChange={(value) => handleSearchChange(visibleSlices[0].id, value)}
          {...panelProps}
        />
      ) : (
        <div
          ref={stackRef}
          style={{ height: '100%', width: '100%', overflowY: 'auto', overflowX: 'hidden' }}
        >
          <Splitter
            layout="vertical"
            // remount so primereact picks up new panel sizes when the arrangement changes
            key={layoutKey}
            onResizeEnd={handlePanelResizeEnd}
            style={{
              width: '100%',
              height: stackTotalHeight,
              overflow: 'hidden',
            }}
          >
            {visibleSlices.map((panel, index) => (
              <SplitterPanel
                key={panel.id}
                size={panelSizes[index]}
                minSize={minSize}
                style={{ overflow: 'hidden' }}
              >
                <SlicerPanel
                  panel={panel}
                  isPrimary={index === 0}
                  showRemove
                  search={searchByPanel[panel.id] ?? ''}
                  onSearchChange={(value) => handleSearchChange(panel.id, value)}
                  {...panelProps}
                />
              </SplitterPanel>
            ))}
          </Splitter>
          {!lastPanelCollapsed && (
            <BottomGutter
              role="separator"
              aria-orientation="horizontal"
              aria-label="Resize last slicer panel"
              tabIndex={0}
              onPointerDown={handleLastPanelResize}
              onKeyDown={handleLastPanelKeys}
            />
          )}
        </div>
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
