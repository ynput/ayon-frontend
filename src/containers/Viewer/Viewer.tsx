import { compareDesc } from 'date-fns'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useAppDispatch, useAppSelector } from '@state/store'
import { Button, Icon } from '@ynput/ayon-react-components'
import { Player, ClipHeaderThumbnail, clearMemoizedPlayables } from '@ynput/ayon-player'
import type { PlayerInitialState, PlayerViewState } from '@ynput/ayon-player'
import type { PlayerPlugins } from '@ynput/ayon-player/plugins'
import type { Clip } from '@ynput/ayon-player/model'
import ReviewVersionDropdown from '@/components/ReviewVersionDropdown'
import { updateSelection, updateProduct } from '@state/viewer'
import ViewerEmpty from './ViewerEmpty'
import ViewerSidebarProviders from './ViewerSidebarProviders'
import useViewerPlayerPlugins, { type UseViewerPlayerPlugins } from './useViewerPlayerPlugins'
import { isPlayable, versionClip } from './viewerClips'
import * as Styled from './Viewer.styled'

// shared
import { useGetViewerReviewablesQuery, useGetEntitiesDetailsPanelQuery } from '@shared/api'
import type { GetReviewablesResponse } from '@shared/api'
import {
  ProjectContextProvider,
  usePowerpack,
  useProjectContext,
  useScopedDetailsPanel,
} from '@shared/context'
import { useLocalStorage } from '@shared/hooks'

interface ViewerProps {
  onClose?: () => void
}

// the details panel, as the player's Sidebar plugin (always the host's)
const sidebarPlugin: NonNullable<PlayerPlugins['Sidebar']> = {
  components: { Sidebar: lazy(() => import('./ViewerSidebar')) },
  providers: ViewerSidebarProviders,
}

// the same panel beside the empty state, under the page's details panel provider
const ViewerDetails = lazy(() => import('./ViewerDetails'))

const playerRouter = { useLocation, useNavigate, useParams, useSearchParams }

// the newest reviewable of a version, to pick the product with the latest review
const latestReviewableDate = (version: GetReviewablesResponse) =>
  (version.reviewables ?? []).reduce(
    (latest, r) =>
      compareDesc(latest, new Date(r.createdAt || 0)) === 1 ? new Date(r.createdAt || 0) : latest,
    new Date(0),
  )

// the reviewable to show after switching to `version`: the one with the label shown now, else the first ready one
const matchingReviewableId = (version: GetReviewablesResponse, label?: string | null) => {
  const ready = version.reviewables?.filter((r) => r.availability === 'ready') ?? []
  const lower = label?.toLowerCase()
  return (ready.find((r) => r.label?.toLowerCase() === lower) ?? ready[0])?.fileId
}

// HERO first, then newest first
const versionOptions = (versions: GetReviewablesResponse[]) =>
  [...versions]
    .sort((a, b) => {
      if (a.name === 'HERO') return -1
      if (b.name === 'HERO') return 1
      return Number(b.version) - Number(a.version)
    })
    .map(({ id, name }) => ({ value: id, label: name }))

const byVersionNumber = (a: GetReviewablesResponse, b: GetReviewablesResponse) =>
  parseInt(a.version, 10) - parseInt(b.version, 10)

const ViewerBody = ({
  onClose,
  reviewPlugins,
}: ViewerProps & { reviewPlugins: PlayerPlugins | null }) => {
  const {
    productId,
    taskId,
    folderId,
    projectName,
    versionIds = [],
    reviewableIds = [],
    selectedProductId,
  } = useAppSelector((state) => state.viewer)
  const user = useAppSelector((state) => state.user)
  const project = useProjectContext()
  const dispatch = useAppDispatch()
  const { setPowerpackDialog } = usePowerpack()
  const containerRef = useRef<HTMLDivElement>(null)

  // several versions (e.g. rows selected in a table) play one after another on a timeline
  const isTimeline = versionIds.length > 1

  // ---- one target (product, task or folder): its versions, one at a time ----
  const { data: allVersionsAndReviewables = [], isFetching: isFetchingReviewables } =
    useGetViewerReviewablesQuery({ projectName, productId, taskId, folderId } as any, {
      skip: isTimeline || !projectName || (!productId && !taskId && !folderId),
    })

  const productOptions = useMemo(() => {
    const products = new Map(allVersionsAndReviewables.map((v) => [v.productId, v]))
    return [...products.values()]
      .map((v) => ({
        value: v.productId,
        label: v.productName || 'Unknown product',
        icon: v.productType ? project.getProductType(v.productType).icon : undefined,
        color: v.productType ? project.getProductType(v.productType).color : undefined,
      }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [allVersionsAndReviewables, project])
  const hasMultipleProducts = productOptions.length > 1
  const selectedProduct = productOptions.find((p) => p.value === selectedProductId)

  // the selected product's versions; without a selection, the product reviewed last
  const versionsAndReviewables = useMemo(() => {
    if (!allVersionsAndReviewables.length) return []
    let shownProductId = allVersionsAndReviewables[0].productId
    if (hasMultipleProducts) {
      shownProductId =
        selectedProductId ??
        [...allVersionsAndReviewables].sort((a, b) =>
          compareDesc(latestReviewableDate(a), latestReviewableDate(b)),
        )[0].productId
    }
    return allVersionsAndReviewables
      .filter((v) => v.productId === shownProductId)
      .sort(byVersionNumber)
  }, [allVersionsAndReviewables, hasMultipleProducts, selectedProductId])

  useEffect(() => {
    if (isTimeline || !hasMultipleProducts || selectedProductId || isFetchingReviewables) return
    const firstProduct = versionsAndReviewables[0]
    if (firstProduct) dispatch(updateProduct({ selectedProductId: firstProduct.productId }))
  }, [
    isTimeline,
    hasMultipleProducts,
    selectedProductId,
    isFetchingReviewables,
    versionsAndReviewables,
    dispatch,
  ])

  const selectedVersion = useMemo(
    () => (isTimeline ? undefined : versionsAndReviewables.find((v) => v.id === versionIds[0])),
    [isTimeline, versionIds, versionsAndReviewables],
  )

  // no version picked (or not one of the product's): show the last one
  useEffect(() => {
    if (isTimeline || selectedVersion || isFetchingReviewables) return
    const lastVersion = versionsAndReviewables[versionsAndReviewables.length - 1]
    if (lastVersion) dispatch(updateSelection({ versionIds: [lastVersion.id] }))
  }, [isTimeline, selectedVersion, isFetchingReviewables, versionsAndReviewables, dispatch])

  // no reviewable picked (or not one of the version's): show the first playable one
  useEffect(() => {
    if (!selectedVersion || isFetchingReviewables) return
    const playable = selectedVersion.reviewables?.filter(isPlayable) ?? []
    if (playable.some((r) => r.fileId === reviewableIds[0])) return
    if (playable[0]) dispatch(updateSelection({ reviewableIds: [playable[0].fileId] }))
  }, [selectedVersion, reviewableIds, isFetchingReviewables, dispatch])

  // ---- several versions: a timeline ----
  const { data: timelineData = [], isFetching: isFetchingTimeline } = useGetViewerReviewablesQuery(
    { projectName: projectName ?? '', versionIds },
    { skip: !isTimeline || !projectName },
  )
  // the reviewable shown per version, once the user picks another one
  const [timelineReviewables, setTimelineReviewables] = useState<Record<string, string>>({})
  // the clips the player has now, see below
  const shownClips = useRef<Clip[]>([])

  // ---- the clips ----
  const clipVersionIds = isTimeline ? versionIds : selectedVersion ? [selectedVersion.id] : []
  const { data: details = [], isLoading: isLoadingDetails } = useGetEntitiesDetailsPanelQuery(
    {
      entityType: 'version',
      entities: clipVersionIds.map((id) => ({ id, projectName: projectName ?? '' })),
    },
    { skip: !clipVersionIds.length || !projectName },
  )

  const clips: Clip[] = useMemo(() => {
    if (!projectName) return []
    const detailsById = new Map(details.map((d) => [d.id, d]))
    if (!isTimeline) {
      if (!selectedVersion) return []
      // the folder doesn't change between versions of a product: keep it while the new version's details load
      const clip = versionClip(
        projectName,
        selectedVersion,
        0,
        reviewableIds[0],
        detailsById.get(selectedVersion.id) ?? details[0],
      )
      return clip ? [clip] : []
    }
    const versions = new Map(timelineData.map((v) => [v.id, v]))
    // Replacing a version refetches the timeline, and until then the data is the previous one's.
    // Keep the clips shown meanwhile: without the new version's clip, the player would lose its
    // place and fall back to the first clip.
    if (isFetchingTimeline && versionIds.some((id) => !versions.has(id))) return shownClips.current
    return versionIds.flatMap((id, slot) => {
      const version = versions.get(id)
      const clip =
        version &&
        versionClip(projectName, version, slot, timelineReviewables[id], detailsById.get(id))
      return clip ? [clip] : []
    })
  }, [
    projectName,
    isTimeline,
    selectedVersion,
    reviewableIds,
    details,
    timelineData,
    isFetchingTimeline,
    versionIds,
    timelineReviewables,
  ])
  useEffect(() => {
    shownClips.current = clips
  }, [clips])

  // ---- the clip on screen: what the header pickers act on ----
  // Only its place: the version and reviewable in it come from the clips, which change when the
  // user picks another reviewable without the player reporting a clip change.
  const [currentSlot, setCurrentSlot] = useState<number | null>(null)
  const handleCurrentClipChange = useCallback((_index: number, clip?: Clip) => {
    setCurrentSlot(clip ? parseInt(clip.listItemId, 10) : null)
  }, [])
  const currentClip = isTimeline
    ? clips.find((clip) => parseInt(clip.listItemId, 10) === currentSlot)
    : clips[0]

  // on a timeline, the version picker lists the current clip's product's versions
  const currentProductId = currentClip?.context.productId
  const { data: currentProductVersions = [] } = useGetViewerReviewablesQuery(
    { projectName: projectName ?? '', productId: currentProductId ?? '' },
    { skip: !isTimeline || !projectName || !currentProductId },
  )
  const pickerVersions = useMemo(
    () => (isTimeline ? [...currentProductVersions].sort(byVersionNumber) : versionsAndReviewables),
    [isTimeline, currentProductVersions, versionsAndReviewables],
  )
  const pickerVersionId = isTimeline ? currentClip?.context.versionId : selectedVersion?.id

  const handleVersionChange = (versionId: string) => {
    const version = pickerVersions.find((v) => v.id === versionId)
    if (!version) return
    const reviewableId = matchingReviewableId(version, currentClip?.label)

    if (!isTimeline) {
      dispatch(updateSelection({ versionIds: [versionId], reviewableIds: [reviewableId || ''] }))
      return
    }
    if (currentSlot === null) return
    // swap the version in the current clip's place on the timeline
    if (reviewableId) setTimelineReviewables((prev) => ({ ...prev, [versionId]: reviewableId }))
    dispatch(updateSelection({ versionIds: versionIds.with(currentSlot, versionId) }))
  }

  const handleProductChange = (productId: string) => {
    dispatch(updateProduct({ selectedProductId: productId }))
  }

  // the player's reviewable picker: remember the pick so rebuilt clips keep it
  const handleReviewableChange = useCallback(
    async (updated: Clip[]) => {
      // the player calls this while updating its own state: update ours after it
      await Promise.resolve()
      const shown = new Map(clips.map((clip) => [clip.listItemId, clip.fileId]))
      const changed = updated.filter((clip) => shown.get(clip.listItemId) !== clip.fileId)
      if (!changed.length) return
      if (!isTimeline) {
        dispatch(updateSelection({ reviewableIds: [changed[0].fileId] }))
        return
      }
      setTimelineReviewables((prev) => ({
        ...prev,
        ...Object.fromEntries(changed.map((clip) => [clip.context.versionId, clip.fileId])),
      }))
    },
    [clips, isTimeline, dispatch],
  )

  // after an upload, the details panel opens on the files
  const { setTab } = useScopedDetailsPanel('review')
  const handleUpload = () => setTab('files')

  // the player memoizes playables in module level maps: start and leave with them empty
  useEffect(() => {
    clearMemoizedPlayables()
    return () => clearMemoizedPlayables()
  }, [])

  // the user's layout (panels, time format), kept between viewer openings
  const [savedView, setSavedView] = useLocalStorage<Partial<PlayerViewState>>(
    'viewer-player-view',
    {},
  )
  // a timeline opens in timeline view, a single version in clip view
  const [initial] = useState<Partial<PlayerInitialState>>(() => ({
    ...savedView,
    clipView: !isTimeline,
    audio: true,
    loop: false,
  }))

  const playerContext = useMemo(
    () => ({
      router: playerRouter,
      toast,
      project,
      projectName: projectName ?? '',
      user: user as any,
    }),
    [project, projectName, user],
  )

  const plugins: PlayerPlugins = useMemo(
    () => ({ ...reviewPlugins, Sidebar: sidebarPlugin }),
    [reviewPlugins],
  )

  // ---- header ----
  const clipDetails = details.find((d) => d.id === pickerVersionId) ?? details[0]
  const folderLabel = clipDetails?.folder?.label || clipDetails?.folder?.name
  const currentFileId = clips.find((c) => c.context.versionId === pickerVersionId)?.fileId

  const headerStart = (
    <Styled.HeaderStart>
      {currentFileId && (
        <ClipHeaderThumbnail
          loading="lazy"
          src={`/api/projects/${projectName}/files/${currentFileId}/thumbnail`}
        />
      )}
      {folderLabel && <span className="path">{folderLabel}</span>}
      {!isTimeline && hasMultipleProducts && (
        <ReviewVersionDropdown
          options={productOptions}
          placeholder="Select a product"
          prefix="Product: "
          value={selectedProductId}
          onChange={handleProductChange}
          valueProps={{ className: 'product-dropdown' }}
          tooltip="Select a product to view its versions reviewables"
          valueIcon={selectedProduct?.icon || ''}
          valueColor={selectedProduct?.color}
        />
      )}
      {!!pickerVersions.length && (
        <ReviewVersionDropdown
          options={versionOptions(pickerVersions)}
          value={pickerVersionId ?? null}
          onChange={handleVersionChange}
        />
      )}
    </Styled.HeaderStart>
  )

  const headerEnd = (
    <Styled.HeaderEnd>
      {!reviewPlugins?.Comparison && (
        <Button
          variant="surface"
          icon="compare"
          data-tooltip="Compare versions with the Review addon"
          onClick={() => setPowerpackDialog({ addon: 'review', feature: 'compare' })}
        >
          Compare
          <Icon icon="bolt" />
        </Button>
      )}
      {isTimeline && !reviewPlugins?.SessionTimeline && (
        <Button
          variant="surface"
          icon="view_timeline"
          data-tooltip={`Play all ${versionIds.length} versions on a timeline with the Review addon`}
          onClick={() => setPowerpackDialog({ addon: 'review', feature: 'timeline' })}
        >
          Timeline
          <Icon icon="bolt" />
        </Button>
      )}
      {onClose && <Button onClick={onClose} icon="close" variant="text" data-tooltip="Close" />}
    </Styled.HeaderEnd>
  )

  const isFetching = isTimeline ? isFetchingTimeline : isFetchingReviewables
  const noVersions = !isTimeline && !versionsAndReviewables.length && !isFetchingReviewables

  if (clips.length && !isLoadingDetails) {
    return (
      <Styled.Container ref={containerRef}>
        <Player
          clips={clips}
          context={playerContext}
          user={user as any}
          theatreContainerRef={containerRef}
          plugins={plugins}
          isSubscribed={!!reviewPlugins}
          onChangeReviewable={handleReviewableChange}
          initial={initial}
          onChangeView={setSavedView}
          headerStart={headerStart}
          headerEnd={headerEnd}
          onCurrentClipChange={handleCurrentClipChange}
        />
      </Styled.Container>
    )
  }

  if (isFetching || isLoadingDetails) return <Styled.Container ref={containerRef} />

  // nothing to play: the version's details stay, e.g. to upload a reviewable or comment
  const emptyVersionId = isTimeline ? versionIds[0] : selectedVersion?.id
  return (
    <Styled.Container ref={containerRef}>
      <Styled.EmptyHeader>
        {headerStart}
        {headerEnd}
      </Styled.EmptyHeader>
      <Styled.EmptyBody>
        <ViewerEmpty
          projectName={projectName ?? ''}
          productId={productId}
          versionId={emptyVersionId}
          reviewables={selectedVersion?.reviewables ?? []}
          noVersions={noVersions}
          onUpload={handleUpload}
        />
        {emptyVersionId && projectName && (
          <Styled.EmptySidebar>
            <Suspense>
              <ViewerDetails projectName={projectName} versionId={emptyVersionId} />
            </Suspense>
          </Styled.EmptySidebar>
        )}
      </Styled.EmptyBody>
    </Styled.Container>
  )
}

// The player decodes with WebCodecs and uses crypto.randomUUID, which browsers only
// expose on HTTPS (or localhost).
const InsecureContext = ({ onClose }: ViewerProps) => (
  <Styled.Message>
    <h2>The viewer needs a secure connection</h2>
    <p>
      Your browser only enables video playback over HTTPS. Open AYON with an https:// address, or
      ask your administrator to set up HTTPS for this server.
    </p>
    {onClose && <Button onClick={onClose} label="Close" />}
  </Styled.Message>
)

// Calls Review's plugins hook. It is set once (the module loaded or not), so the hook order holds.
const ViewerWithPlugins = ({
  onClose,
  useReviewPlugins,
}: ViewerProps & { useReviewPlugins: UseViewerPlayerPlugins }) => {
  const review = useReviewPlugins()
  // the player's plugin set can't change once it is mounted: a licence change (site info
  // refetched) mounts a new one
  if (review.isLoading) return null
  return (
    <ViewerBody
      key={review.plugins ? 'review' : 'none'}
      onClose={onClose}
      reviewPlugins={review.plugins}
    />
  )
}

const Viewer = ({ onClose }: ViewerProps) => {
  const { projectName } = useAppSelector((state) => state.viewer)
  const [useReviewPlugins, { isLoading }] = useViewerPlayerPlugins()

  if (!projectName) {
    console.error('No project name provided to Viewer')
    return null
  }
  if (!window.isSecureContext) return <InsecureContext onClose={onClose} />
  if (isLoading) return null

  return (
    <ProjectContextProvider projectName={projectName}>
      <ViewerWithPlugins onClose={onClose} useReviewPlugins={useReviewPlugins} />
    </ProjectContextProvider>
  )
}

export default Viewer
