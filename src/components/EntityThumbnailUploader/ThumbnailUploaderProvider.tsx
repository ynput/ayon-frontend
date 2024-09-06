import { createContext, useState } from "react"

import useCreateContext from "@hooks/useCreateContext"
import { $Any } from "@types"

const ThumbnailUploadContext = createContext<{
  onContextMenu?: Function
  resetFileUploadState?: Function
  inputRef?: HTMLInputElement
}>({})

type Props = {
  handleThumbnailUpload: (thumbnails: $Any[]) => {}
  entities: $Any
  inputRef: $Any;
  children?: JSX.Element|JSX.Element[];
}

const ThumbnailUploadProvider = ({
  children = [],
  inputRef,
}: Props) => {

  const [_, setFileUploadInProgress] = useState(false)
  const [ctxMenuShow] = useCreateContext()
  const resetFileUploadState = () => setFileUploadInProgress(false)

  const ctxMenuItems = () => [
    {
      label: 'Upload new thumbnail',
      icon: 'add_photo_alternate',
      command: () => {
        if (inputRef) {
          inputRef.current!.click();
        }
        return setFileUploadInProgress(true)
      },
    },
  ]

  const onContextMenu = (event: MouseEvent) => {
    ctxMenuShow(event, ctxMenuItems())
  }

  return (
    <ThumbnailUploadContext.Provider value={{ onContextMenu, resetFileUploadState }}>
      {children}
    </ThumbnailUploadContext.Provider>
  )
}

export {ThumbnailUploadProvider, ThumbnailUploadContext}
