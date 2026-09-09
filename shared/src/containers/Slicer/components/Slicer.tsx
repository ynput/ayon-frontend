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

// a collapsed panel is fixed at its header height, so the gutters either side of it have
// nothing to resize. primereact renders panel, gutter, panel, ... as siblings.
const PanelStack = styled.div<{ $deadGutters: number[] }>`
  height: 100%;
  width: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  ${({ $deadGutters }) =>
    $deadGutters
      .map(
        (index) => `
    & > .p-splitter > :nth-child(${index * 2 + 2}) {
      pointer-events: none;
      cursor: default;
    }
  `,
      )
      .join('')}
`

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

  // the split affordance stays visible without a license and sells the power feature; the
  // panels behind it do not, so a stored arrangement silently falls back to its first panel
  const splitEnabled = !!enableSplit
  const visibleSlices = splitEnabled && powerLicense ? slices : slices.slice(0, 1)

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
    handleResizeEnd: handlePanelResizeEnd,
  } = useSlicerPanelHeights(page, panelIds, canCollapse ? collapsedPanels : [], columnHeight)

  const deadGutters = panelIds
    .slice(0, -1)
    .map((id, index) =>
      canCollapse && (collapsedPanels.includes(id) || collapsedPanels.includes(panelIds[index + 1]))
        ? index
        : -1,
    )
    .filter((index) => index >= 0)

  // an undefined entry is a closed search box, '' an open and empty one
  const [searchByPanel, setSearchByPanel] = useState<Record<string, string | undefined>>({})
  const handleSearchChange = useCallback(
    (panelId: string, value: string | undefined) =>
      setSearchByPanel((prev) => ({ ...prev, [panelId]: value })),
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
          search={searchByPanel[visibleSlices[0].id]}
          onSearchChange={(value) => handleSearchChange(visibleSlices[0].id, value)}
          {...panelProps}
        />
      ) : (
        <PanelStack ref={stackRef} $deadGutters={deadGutters}>
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
                  search={searchByPanel[panel.id]}
                  onSearchChange={(value) => handleSearchChange(panel.id, value)}
                  {...panelProps}
                />
              </SplitterPanel>
            ))}
          </Splitter>
        </PanelStack>
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
