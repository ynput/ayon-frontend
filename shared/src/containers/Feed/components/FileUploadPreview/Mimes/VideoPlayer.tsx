import { useEffect, useMemo, useRef } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Player, compactPlayerControls, clearMemoizedPlayables } from '@ynput/ayon-player'
import { ClipType } from '@ynput/ayon-player/model'
import type { Clip, ReviewableContext } from '@ynput/ayon-player/model'
import { useGlobalContext } from '@shared/context'
import * as Styled from '../FileUploadPreview.styled'

const playerInitialState = { loop: true, audio: true }

// pre-ffprobe uploads carry no metadata and the browser can't report fps
const DEFAULT_FPS = 24
const DEFAULT_CODEC = 'h264'

// Player only needs a shape here, but attributes.ts does `name in` on the two attribute
// objects, so they must be objects rather than undefined
const emptyClipContext: ReviewableContext = {
  activityId: '',
  versionName: '',
  versionId: '',
  versionStatus: '',
  versionAuthor: '',
  versionAuthorFullName: '',
  versionNumber: 0,
  versionAttributes: {},
  productName: '',
  productType: '',
  productId: '',
  productFolderId: '',
  productAttributes: {},
  taskAttributes: {},
  path: '',
}

export interface VideoPlayerProps {
  id: string
  name: string
  url: string
  projectName: string
  duration: number
  width: number
  height: number
  fps?: number
  codec?: string
}

const VideoPlayer = ({
  id,
  name,
  url,
  projectName,
  duration,
  width,
  height,
  fps,
  codec,
}: VideoPlayerProps) => {
  const { user } = useGlobalContext()
  const containerRef = useRef<HTMLDivElement>(null)

  // the player memoizes playables in module-level maps it never clears — without this,
  // the next video opened resumes at the previous one's currentTime and old <video>
  // elements stay detached in memory
  useEffect(() => {
    clearMemoizedPlayables()
    return () => clearMemoizedPlayables()
  }, [id])

  const clips: Clip[] = useMemo(
    () => [
      {
        listItemId: id,
        fileId: id,
        label: name,
        type: ClipType.VIDEO,
        url,
        position: 0,
        fps: fps || DEFAULT_FPS,
        codec: codec || DEFAULT_CODEC,
        duration,
        width,
        height,
        context: emptyClipContext,
      },
    ],
    [id, name, url, duration, width, height, fps, codec],
  )

  const playerContext = useMemo(
    () => ({
      router: { useLocation, useNavigate, useParams, useSearchParams },
      toast,
      projectName,
    }),
    [projectName],
  )

  return (
    <Styled.PlayerWrapper ref={containerRef}>
      <Player
        clips={clips}
        user={{ name: user?.name || '' }}
        context={playerContext}
        theatreContainerRef={containerRef}
        showHeader={false}
        showReviewables={false}
        controls={compactPlayerControls}
        initial={playerInitialState}
      />
    </Styled.PlayerWrapper>
  )
}

export default VideoPlayer
