import { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import VersionsProductsPageProviders from './providers'
import { Section } from '@ynput/ayon-react-components'
import { Splitter, SplitterPanel } from 'primereact/splitter'
import { useSlicerContext, Slicer } from '@shared/containers/Slicer'
import { useProjectContext, useProjectFoldersContext, useSettingsPanel, useURIContext } from '@shared/context'
import {
  getCellId,
  parseCellId,
  ROW_SELECTION_COLUMN_ID,
  useSelectionCellsContext,
} from '@shared/containers'
import { useSearchParams } from 'react-router-dom'
import VPToolbar from './components/VPToolbar/VPToolbar'
// TABLES
import VPTable from './components/VPTable/VPTable'
import VPGrid from './components/VPGrid/VPGrid'
import VersionsListTable from './components/VersionsListTable/VersionsListTable'

import { useVPViewsContext } from './context/VPViewsContext'
import VPDetailsPanel from './components/VPDetailsPanel/VPDetailsPanel'
import { useVersionsSelectionContext } from './context/VPSelectionContext'
import { useVersionsDataContext } from './context/VPDataContext'
import { VPTableSettings } from './components/VPTableSettings/VPTableSettings'
import { DetailsDialog } from '@shared/components'
import { useVPContextMenu } from './hooks/useVPContextMenu'
import DetailsPanelSplitter from '@components/DetailsPanelSplitter'
import NewListFromContext from '@pages/ProjectListsPage/components/NewListDialog/NewListFromContext.tsx'
import useGoToEntity from '@hooks/useGoToEntity'

interface VersionsProductsPageProps {
  projectName: string
  children?: React.ReactNode
}

const URLSelectionSync = () => {
  const [searchParams] = useSearchParams()
  const { projectName } = useProjectContext()
  const { entitiesMap, setExpanded: setProductsExpanded } = useVersionsDataContext()
  const { onUpdateFilters, onUpdateViewGroupBy, onUpdateSlicerType } = useVPViewsContext()
  const slicer = useSlicerContext()
  const { getFolderById } = useProjectFoldersContext()
  const { setSelectedCells, setFocusedCellId, setAnchorCell } = useSelectionCellsContext()
  const { uriType, entity: uriEntity, getUriEntities } = useURIContext()
  const { getGoToEntityData } = useGoToEntity()
  const [selectionRequest, setSelectionRequest] = useState<{
    key: string
    entityId: string
    entityType: 'product' | 'version'
    viewGroupBy: 'hierarchy' | undefined
    folderId?: string
    productId?: string
  } | null>(null)
  const preparedSelectionRef = useRef<string | null>(null)
  const lastAppliedSelectionRef = useRef<string | null>(null)

  const buildFolderSelectionData = useCallback(
    (selectedFolders: Record<string, boolean>) =>
      Object.keys(selectedFolders).reduce<Record<string, { id: string; name?: string; label?: string; path?: string; parents?: string[] }>>((acc, folderId) => {
        if (!selectedFolders[folderId]) return acc

        const folder = getFolderById(folderId)
        acc[folderId] = {
          id: folderId,
          name: folder?.name,
          label: folder?.label || folder?.name,
          path: folder?.path,
          parents: folder?.parents,
        }
        return acc
      }, {}),
    [getFolderById],
  )

  const selectionTarget = useMemo(() => {
    if (searchParams.get('project') !== projectName) return null

    const entityType = searchParams.get('type') as 'product' | 'version' | null
    const entityId = searchParams.get('id')
    const targetEntityType = searchParams.get('targetType')
    const targetEntityId = searchParams.get('targetId')

    if (!entityType || !entityId) return null

    if (entityType === 'product') {
      return { entityType: 'product' as const, entityId, viewGroupBy: 'hierarchy' as const }
    }

    if (targetEntityType === 'version' && targetEntityId) {
      return { entityType: 'version' as const, entityId: targetEntityId, viewGroupBy: undefined }
    }

    return { entityType, entityId, viewGroupBy: undefined }
  }, [projectName, searchParams])

  useEffect(() => {
    if (!selectionTarget) {
      preparedSelectionRef.current = null
      lastAppliedSelectionRef.current = null
      setSelectionRequest(null)
      return
    }

    const selectionKey = `${selectionTarget.entityType}:${selectionTarget.entityId}:${uriType === 'entity' ? uriEntity?.projectName || '' : ''}`
    if (preparedSelectionRef.current === selectionKey) return

    preparedSelectionRef.current = selectionKey
    lastAppliedSelectionRef.current = null
    void onUpdateFilters({})
    void onUpdateViewGroupBy(selectionTarget.viewGroupBy)
    void onUpdateSlicerType('hierarchy')
    slicer.setSliceType('hierarchy')
    slicer.setPersistentRowSelectionData({})

    let cancelled = false

    const resolveSelection = async () => {
      let folderId: string | undefined
      let productId: string | undefined

      if (uriType === 'entity' && uriEntity?.projectName === projectName) {
        const resolvedUris = await getUriEntities()
        const resolvedEntity = resolvedUris.find(({ uri }) => uri === searchParams.get('uri'))?.entities?.[0] ||
          resolvedUris[0]?.entities?.[0]

        folderId = resolvedEntity?.folderId
        productId = resolvedEntity?.productId
      }

      if (cancelled) return

      const data = getGoToEntityData(selectionTarget.entityId, selectionTarget.entityType, {
        folder: folderId,
        product: productId,
      })
      const selectionData = buildFolderSelectionData(data.selectedFolders)

      slicer.setSliceType('hierarchy')
      slicer.setExpanded(data.expandedFolders)
      slicer.setRowSelection(data.selectedFolders)
      slicer.setRowSelectionData(selectionData)
      slicer.setPersistentRowSelectionData(selectionData)

      setSelectionRequest({
        key: selectionKey,
        entityId: selectionTarget.entityId,
        entityType: selectionTarget.entityType as 'product' | 'version',
        viewGroupBy: selectionTarget.viewGroupBy,
        folderId,
        productId,
      })
    }

    void resolveSelection()

    return () => {
      cancelled = true
    }
  }, [
    getUriEntities,
    getGoToEntityData,
    buildFolderSelectionData,
    onUpdateFilters,
    onUpdateSlicerType,
    onUpdateViewGroupBy,
    projectName,
    searchParams,
    selectionTarget,
    uriEntity?.projectName,
    uriType,
  ])

  useEffect(() => {
    if (!selectionRequest) return
    if (lastAppliedSelectionRef.current === selectionRequest.key) return
    if (!entitiesMap.has(selectionRequest.entityId)) return

    const data = getGoToEntityData(selectionRequest.entityId, selectionRequest.entityType, {
      folder: selectionRequest.folderId,
      product: selectionRequest.productId,
    })
    const selectionData = buildFolderSelectionData(data.selectedFolders)

    slicer.setSliceType('hierarchy')
    slicer.setExpanded(data.expandedFolders)
    slicer.setRowSelection(data.selectedFolders)
    slicer.setRowSelectionData(selectionData)
    slicer.setPersistentRowSelectionData(selectionData)

    if (selectionRequest.entityType === 'product') {
      setProductsExpanded({ [selectionRequest.entityId]: true })
    } else if (selectionRequest.entityType === 'version' && selectionRequest.productId) {
      setProductsExpanded({ [selectionRequest.productId]: true })
    }

    const rowSelectionCellId = getCellId(selectionRequest.entityId, ROW_SELECTION_COLUMN_ID)
    setSelectedCells(new Set([getCellId(selectionRequest.entityId, 'name'), rowSelectionCellId]))
    setFocusedCellId(rowSelectionCellId)
    setAnchorCell(parseCellId(rowSelectionCellId))
    lastAppliedSelectionRef.current = selectionRequest.key
  }, [
    entitiesMap,
    buildFolderSelectionData,
    getGoToEntityData,
    selectionRequest,
    setAnchorCell,
    setFocusedCellId,
    setProductsExpanded,
    setSelectedCells,
    slicer,
  ])

  return null
}

const VersionsProductsPage: FC<VersionsProductsPageProps> = ({}) => {
  // contexts
  const { isPanelOpen } = useSettingsPanel()
  const { config } = useSlicerContext()
  const { showGrid } = useVPViewsContext()
  const { showVersionsTable } = useVersionsSelectionContext()
  const { projectName } = useProjectContext()

  // modal dialog state for product and version details
  const [showDetail, setShowDetail] = useState<false | 'product' | 'version'>(false)
  const [detailIds, setDetailIds] = useState<string[]>([])

  // context menu items
  const contextMenuItems = useVPContextMenu({
    onOpenProductDetail: (ids: string[]) => {
      setDetailIds(ids)
      setShowDetail('product')
    },
    onOpenVersionDetail: (ids: string[]) => {
      setDetailIds(ids)
      setShowDetail('version')
    },
  })

  // load slicer remote config
  const overviewSliceFields = config?.versions?.fields

  return (
    <main style={{ gap: 4 }}>
      <URLSelectionSync />
      <Splitter
        layout="horizontal"
        style={{ width: '100%', height: '100%' }}
        stateKey="overview-splitter-table"
        stateStorage="local"
      >
        <SplitterPanel size={12} minSize={2} style={{ maxWidth: 600 }}>
          <Section wrap>
            <Slicer
              sliceFields={overviewSliceFields}
              persistFieldId="hierarchy"
              entityTypes={['version', 'task', 'folder']}
            />
          </Section>
        </SplitterPanel>
        <SplitterPanel size={88}>
          <Section wrap direction="column" style={{ height: '100%' }}>
            <VPToolbar />
            <Splitter
              layout="horizontal"
              stateKey="overview-splitter-settings"
              stateStorage="local"
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            >
              <SplitterPanel size={82}>
                <DetailsPanelSplitter
                  layout="horizontal"
                  stateKey="overview-splitter-details"
                  stateStorage="local"
                  style={{ width: '100%', height: '100%' }}
                >
                  <SplitterPanel size={70}>
                    {showGrid ? (
                      <VPGrid contextMenuItems={contextMenuItems} />
                    ) : (
                      <VPTable contextMenuItems={contextMenuItems} />
                    )}
                  </SplitterPanel>
                  {showVersionsTable ? (
                    <SplitterPanel size={15} style={{ minWidth: 100 }}>
                      <VersionsListTable />
                    </SplitterPanel>
                  ) : (
                    <SplitterPanel className="hidden"></SplitterPanel>
                  )}

                  <SplitterPanel
                    size={30}
                    style={{
                      zIndex: 300,
                      minWidth: 300,
                    }}
                    className="details"
                  >
                    <VPDetailsPanel />
                  </SplitterPanel>
                </DetailsPanelSplitter>
              </SplitterPanel>
              {isPanelOpen ? (
                <SplitterPanel
                  size={18}
                  style={{
                    zIndex: 500,
                  }}
                >
                  <VPTableSettings />
                </SplitterPanel>
              ) : (
                <SplitterPanel className="hidden"></SplitterPanel>
              )}
            </Splitter>
          </Section>
        </SplitterPanel>
      </Splitter>
      <DetailsDialog
        projectName={projectName}
        entityType={showDetail || 'product'}
        entityIds={detailIds}
        visible={!!showDetail}
        onHide={() => setShowDetail(false)}
      />
      <NewListFromContext />
    </main>
  )
}

// wrap with all the providers
const VersionsProductsPageWithProviders: FC<VersionsProductsPageProps> = ({ projectName }) => (
  <VersionsProductsPageProviders projectName={projectName}>
    <VersionsProductsPage projectName={projectName} />
  </VersionsProductsPageProviders>
)

export default VersionsProductsPageWithProviders
