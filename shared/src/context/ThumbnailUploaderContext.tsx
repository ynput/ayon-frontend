import { createContext, useState } from 'react'

import { useCreateContextMenu } from '@shared/containers/ContextMenu'

export const ThumbnailUploadContext = createContext<{
  onContextMenu?: Function
  resetFileUploadState?: Function
  inputRef?: HTMLInputElement
}>({})

export type ThumbnailUploadProviderProps = {
  handleThumbnailUpload: (thumbnails: any[]) => {}
  entities: any
  inputRef: any
  children?: JSX.Element | JSX.Element[]
}

export const ThumbnailUploadProvider = ({
  children = [],
  inputRef,
}: ThumbnailUploadProviderProps) => {
  const [_, setFileUploadInProgress] = useState(false)
  const [ctxMenuShow] = useCreateContextMenu()
  const resetFileUploadState = () => setFileUploadInProgress(false)

  const ctxMenuItems = () => [
    {
      label: 'Upload new thumbnail',
      icon: 'add_photo_alternate',
      command: () => {
        if (inputRef) {
          inputRef.current!.click()
        }
        return setFileUploadInProgress(true)
      },
    },
  ]

  const onContextMenu = (event: MouseEvent) => {
    // @ts-expect-error - I just can't do this right now
    ctxMenuShow(event, ctxMenuItems())
  }

  return (
    <ThumbnailUploadContext.Provider value={{ onContextMenu, resetFileUploadState }}>
      {children}
    </ThumbnailUploadContext.Provider>
  )
}

export const useThumbnailUploadContext = () => {
  const context = ThumbnailUploadContext
  if (!context) {
    throw new Error('useThumbnailUploadContext must be used within a ThumbnailUploadProvider')
  }
  return context
}
