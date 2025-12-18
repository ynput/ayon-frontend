import { compareDesc } from 'date-fns'
import { useCallback, useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '@state/store'
import { useFullScreenHandle } from 'react-full-screen'
import { Button } from '@ynput/ayon-react-components'
import VersionSelectorTool from '@components/VersionSelectorTool/VersionSelectorTool'
import ReviewVersionDropdown from '@/components/ReviewVersionDropdown'
import ReviewablesSelector from '@components/ReviewablesSelector'
import { toggleFullscreen, toggleUpload, updateSelection, updateProduct } from '@state/viewer'
import ViewerComponent from './ViewerComponent'
import ViewerDetailsPanel from './ViewerDetailsPanel'
import * as Styled from './Viewer.styled'
import { ViewerProvider } from '@context/ViewerContext'

// shared
import { useGetViewerReviewablesQuery, useGetEntitiesDetailsPanelQuery } from '@shared/api'
import type { GetReviewablesResponse } from '@shared/api'
import { getGroupedReviewables } from '@shared/components'
import { useScopedDetailsPanel } from '@shared/context'
import { ProjectContextProvider, useProjectContext } from '@shared/context/ProjectContext'
import { useLocalStorage } from '@shared/hooks'

interface ViewerProps {
  onClose?: () => void
  canOpenInNew?: boolean
}

const ViewerBody = ({ onClose }: ViewerProps) => {

  const [minimizedWindow, setMinimizedWindow] = useLocalStorage('viewer-minimized-window', false)
  const {
    productId,
    taskId,
    folderId,
    projectName,
    versionIds = [],
    reviewableIds = [],
    fullscreen,
    quickView,
    selectedProductId,
  } = useAppSelector((state) => state.viewer)

  const project = useProjectContext()
  const dispatch = useAppDispatch()

  // new query: returns all reviewables for a product
  const { data: allVersionsAndReviewables = [], isFetching: isFetchingReviewables } =
    useGetViewerReviewablesQuery({ projectName, productId, taskId, folderId } as any, {
      skip: !projectName || (!productId && !taskId && !folderId),
    })

  // check if there are multiple products in the reviewables. At least one productId is different
  const hasMultipleProducts = useMemo(() => {
    const uniqueProductIds = new Set(allVersionsAndReviewables.map((v) => v.productId))
    return uniqueProductIds.size > 1
  }, [allVersionsAndReviewables])

  // create a unique list of productIds
  const uniqueProducts = useMemo(() => {
    const uniqueProductIds = new Set(allVersionsAndReviewables.map((v) => v.productId))
    return Array.from(uniqueProductIds)
  }, [allVersionsAndReviewables])

  const productOptions = useMemo(() => {
    return [...uniqueProducts]
      .map((id) => {
        const product = allVersionsAndReviewables.find((v) => v.productId === id)
        return {
          value: id,
          label: product?.productName || 'Unknown product',
          icon: product?.productType && project.getProductType(product.productType).icon,
          color: product?.productType && project.getProductType(product.productType).color,
        }
      })
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [uniqueProducts, allVersionsAndReviewables])

  const selectedProduct = useMemo(
    () => productOptions.find((p) => p.value === selectedProductId),
    [uniqueProducts, selectedProductId],
  )

  // sort all versions and reviewables by the latest reviewable createdAt date
  const sortedVersionsReviewableDates = useMemo(
    () =>
      hasMultipleProducts
        ? [...allVersionsAndReviewables].sort((a, b) => {
            // Find the reviewable with the latest createdAt date in a
            const aLatestReviewable = a.reviewables?.reduce((latest, current) => {
              return compareDesc(
                new Date(latest.createdAt || 0),
                new Date(current.createdAt || 0),
              ) === 1
                ? latest
                : current
            }, a.reviewables[0])

            // Find the reviewable with the latest createdAt date in b
            const bLatestReviewable = b.reviewables?.reduce((latest, current) => {
              return compareDesc(
                new Date(latest.createdAt || 0),
                new Date(current.createdAt || 0),
              ) === 1
                ? latest
                : current
            }, b.reviewables[0])

            // Use compareDesc to compare the latest reviewables' createdAt dates
            return compareDesc(
              new Date(aLatestReviewable?.createdAt || 0),
              new Date(bLatestReviewable?.createdAt || 0),
            )
          })
        : allVersionsAndReviewables,
    [allVersionsAndReviewables, hasMultipleProducts],
  )

  // check if a specific product is selected
  const versionsAndReviewables: GetReviewablesResponse[] = useMemo(() => {
    if (!hasMultipleProducts) return allVersionsAndReviewables
    else if (selectedProductId) {
      // filter out the versions for the selected product
      return allVersionsAndReviewables.filter((v) => v.productId === selectedProductId)
    } else {
      // find the version (and therefor product) with the reviewable that was last createdAt
      const latestProductId = sortedVersionsReviewableDates[0].productId
      if (latestProductId) {
        return allVersionsAndReviewables.filter((v) => v.productId === latestProductId)
      } else {
        // return first product
        const firstProduct = allVersionsAndReviewables[0]
        return allVersionsAndReviewables.filter((v) => v.productId === firstProduct.productId)
      }
    }
  }, [allVersionsAndReviewables, selectedProductId])
  // if hasMultipleProducts and no selectedProductId, select the first product
  useEffect(() => {
    if (hasMultipleProducts && !selectedProductId && !isFetchingReviewables) {
      const firstProduct = versionsAndReviewables[0]
      dispatch(updateProduct({ selectedProductId: firstProduct.productId }))
    }
  }, [
    hasMultipleProducts,
    selectedProductId,
    isFetchingReviewables,
    versionsAndReviewables,
    dispatch,
  ])

  // v003 or v004, etc
  const selectedVersion = useMemo(
    () => versionsAndReviewables.find((v) => v.id === versionIds[0]),
    [versionIds, versionsAndReviewables],
  )

  // Determine entity type and ID for the query
  const { entityType, entityId } = useMemo(() => {
    if (folderId && !taskId && !productId) {
      return { entityType: 'folder' as const, entityId: folderId }
    } else if (taskId && !productId) {
      return { entityType: 'task' as const, entityId: taskId }
    } else if (versionIds[0]) {
      return { entityType: 'version' as const, entityId: versionIds[0] }
    }
    return { entityType: null, entityId: null }
  }, [folderId, taskId, productId, versionIds])

  // Fetch entity details to get folder path
  const { data: entityDetails = [] } = useGetEntitiesDetailsPanelQuery(
    {
      entityType: entityType!,
      entities: entityId && projectName ? [{ id: entityId, projectName }] : [],
    },
    { skip: !entityId || !projectName || !entityType },
  )

  const versionPath = useMemo(() => {
    if (!entityDetails.length) return ''

    const { folder, task, version } = entityDetails[0]
    const entity = folder || task
    const label = entity?.label || entity?.name
    const versionName = version?.name || selectedVersion?.name

    return [ label, versionName].filter(Boolean).join(' / ')
  }, [entityDetails, selectedVersion])

  // if no versionIds are provided, select the last version and update the state
  useEffect(() => {
    if ((!versionIds.length || !selectedVersion) && !isFetchingReviewables) {
      const lastVersion = versionsAndReviewables[versionsAndReviewables.length - 1]
      if (lastVersion) {
        dispatch(updateSelection({ versionIds: [lastVersion.id] }))
      }
    }
  }, [versionIds, selectedVersion, isFetchingReviewables, versionsAndReviewables, dispatch])

  const versionReviewableIds = selectedVersion?.reviewables?.map((r) => r.fileId) || []

  // if no reviewableIds are provided, select the first playable reviewable
  useEffect(() => {
    if (
      (!reviewableIds.length ||
        !reviewableIds.every((id: string) => versionReviewableIds.includes(id))) &&
      !isFetchingReviewables &&
      selectedVersion
    ) {
      const firstReviewableId = selectedVersion.reviewables?.find((r) =>
        ['ready', 'conversionRecommended'].includes(r.availability || ''),
      )?.fileId

      if (firstReviewableId) {
        dispatch(updateSelection({ reviewableIds: [firstReviewableId] }))
      }
    }
  }, [reviewableIds, versionReviewableIds, isFetchingReviewables, selectedVersion, dispatch])

  const selectedReviewable = useMemo(
    // for now we only support one reviewable
    () => selectedVersion?.reviewables?.find((r) => r.fileId === reviewableIds[0]),
    [reviewableIds, selectedVersion],
  )

  const handleProductChange = (productId: string) => {
    dispatch(updateProduct({ selectedProductId: productId }))
  }

  const handleVersionChange = (versionId: string) => {
    // try and find a matching reviewable in the new version with the same label as the current reviewable
    const currentLabel = selectedReviewable?.label?.toLowerCase()

    const newVersion = versionsAndReviewables.find((v) => v.id === versionId)

    // no version? that's weird
    if (!newVersion) return console.error('No version found for id', versionId)

    let newReviewableId = newVersion.reviewables?.find(
      (r) => r.label?.toLowerCase() === currentLabel && r.availability === 'ready',
    )?.fileId

    // no matching reviewable? just pick the first ready one
    if (!newReviewableId)
      newReviewableId = newVersion.reviewables?.find((r) => r.availability === 'ready')?.fileId

    dispatch(updateSelection({ versionIds: [versionId], reviewableIds: [newReviewableId || ''] }))
  }

  const handleReviewableChange = (reviewableId: string) => {
    dispatch(updateSelection({ reviewableIds: [reviewableId] }))
  }

  const { setTab } = useScopedDetailsPanel('review')

  const handleUploadAction =
    (toggleNativeFileUpload = false) =>
    () => {
      // switch to files tab
      setTab('files')
      // open the file dialog
      if (toggleNativeFileUpload) {
        dispatch(toggleUpload(true))
      }
    }

  const handle = useFullScreenHandle()

  useEffect(() => {
    if (fullscreen) {
      // check if it's already open
      if (!handle.active) handle.enter()
    } else {
      if (handle.active) handle.exit()
    }
  }, [handle, fullscreen])

  const fullScreenChange = (state: boolean) => {
    // when closing, ensure the state is updated
    if (!state && fullscreen) {
      dispatch(toggleFullscreen({ fullscreen: false }))
    }
  }

  const toggleMinimized = useCallback(() => {
    setMinimizedWindow(!minimizedWindow)
  }, [minimizedWindow, setMinimizedWindow])

  // Handle keyboard shortcut for toggling minimized window (C key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // abort if modifier keys are pressed
      if (e.ctrlKey || e.altKey || e.metaKey) return

      // Toggle minimized window on 'c' key
      if (e.key === 'c') {
        toggleMinimized()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [toggleMinimized])

  const reviewables = selectedVersion?.reviewables || []

  const { playable } = useMemo(() => getGroupedReviewables(reviewables as any), [reviewables])

  const noVersions = !versionsAndReviewables.length && !isFetchingReviewables

  return (
    <ViewerProvider selectedVersionId={selectedVersion?.id}>
      <Styled.Container className={minimizedWindow ? 'grid ' : 'grid minimized'}>
        {minimizedWindow && (
          <Styled.PlayerToolbar>
            <>
              <VersionSelectorTool
                versions={versionsAndReviewables}
                selected={versionIds[0]}
                onChange={handleVersionChange}
              />
              {hasMultipleProducts && (
                <ReviewVersionDropdown
                  options={productOptions}
                  placeholder="Select a product"
                  prefix="Product: "
                  value={selectedProductId}
                  onChange={handleProductChange}
                  valueProps={{ className: 'product-dropdown' }}
                  tooltip="Select a product to view its versions reviewables"
                  shortcut={''}
                  valueIcon={selectedProduct?.icon || ''}
                  valueColor={selectedProduct?.color}
                />
              )}
            </>
          </Styled.PlayerToolbar>
        )}

          <Styled.MinimizedToolbar className={minimizedWindow ? 'minimized' : ''}>
            {!minimizedWindow && versionPath && <Styled.PathDisplay>{versionPath}</Styled.PathDisplay>}
            <Styled.ButtonGroup>
              <Button
                icon={'dock_to_left'}
                className={minimizedWindow ? 'details active' : 'details'}
                data-tooltip={minimizedWindow ? 'Toggle to show details' : 'Toggle to hide all'}
                data-tooltip-position="bottom"
                data-shortcut={'C'}
                onClick={toggleMinimized}
              >
                Details
              </Button>
              {onClose && <Button onClick={onClose} icon={'close'} className="close" />}
            </Styled.ButtonGroup>
          </Styled.MinimizedToolbar>

          {/*<Styled.ButtonGroup>*/}
          {/*  <Button*/}
          {/*    icon={'dock_to_left'}*/}
          {/*    className={'details active'}*/}
          {/*    data-tooltip={'Toggle to show details'}*/}
          {/*    data-tooltip-position="bottom"*/}
          {/*    data-shortcut={'C'}*/}
          {/*    onClick={toggleMinimized}*/}
          {/*  >*/}
          {/*    Details*/}
          {/*  </Button>*/}
          {/*  {onClose && <Button onClick={onClose} icon={'close'} className="close" />}*/}
          {/*</Styled.ButtonGroup>*/}

        <Styled.FullScreenWrapper handle={handle} onChange={fullScreenChange}>
          <ViewerComponent
            projectName={projectName}
            productId={productId}
            reviewables={reviewables}
            selectedReviewable={selectedReviewable}
            versionIds={versionIds}
            versionReviewableIds={versionReviewableIds}
            isFetchingReviewables={isFetchingReviewables}
            noVersions={noVersions}
            quickView={quickView}
            onUpload={handleUploadAction}
          />
        </Styled.FullScreenWrapper>
        {minimizedWindow && (
          <Styled.RightToolBar style={{ zIndex: 1100 }}>
            <ReviewablesSelector
              reviewables={playable}
              selected={reviewableIds}
              onChange={handleReviewableChange}
              onUpload={handleUploadAction(true)}
              projectName={projectName}
            />
            <div id="annotation-tools" style={{ position: 'relative' }}></div>
          </Styled.RightToolBar>
        )}
        {minimizedWindow && (
          <ViewerDetailsPanel
            versionIds={versionIds}
            projectName={projectName}
            noVersions={noVersions}
          />
        )}
      </Styled.Container>
    </ViewerProvider>
  )
}

const Viewer = ({ onClose }: ViewerProps) => {
  const { projectName } = useAppSelector((state) => state.viewer)

  if (!projectName) {
    console.error('No project name provided to Viewer')
    return null
  }

  return (
    <ProjectContextProvider projectName={projectName}>
      <ViewerBody onClose={onClose} />
    </ProjectContextProvider>
  )
}

export default Viewer
