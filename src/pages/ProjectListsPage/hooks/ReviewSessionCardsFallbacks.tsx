import { RemoteAddonProjectProps } from '@shared/context'
import { PropsWithChildren } from 'react'
import type { Clip, UpdateType } from './useReviewSessionCardsModules'

export function FallbackReviewCardsProvider({
  children,
}: RemoteAddonProjectProps &
  PropsWithChildren & {
    onSelectionChange: (versionIds: string[]) => void
    onOpenDetails: (versionId: string) => void
    onItemsChanged?: (clips: Clip[], promise?: Promise<unknown>, updateType?: UpdateType) => void
    onOpenInViewer?: (state: {
      versionId: string
      productId: string
      folderId: string
      taskId?: string
    }) => void
    headerContentStart?: JSX.Element
    headerContentEnd?: JSX.Element
    api?: any
    gridSize?: number
    playlistView?: boolean
  }) {
  return <>{children}</>
}

export function FallbackReviewCardsControlsRight({}: { groupingDisabled?: boolean }) {
  return <></>
}
