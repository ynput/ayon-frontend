export type ViewerArgs = {
  entityId?: string
  versionId?: string
  projectName?: string
  folderId?: string
  taskId?: string
  productId?: string
}

export type ApiError = {
  message: string
  status?: number
  code?: string
}

export type PubSubMessage = {
  topic: string
  data: unknown
  timestamp?: number
}

export type ComponentProps = {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}

export type FormValue = string | number | boolean | string[] | number[] | null | undefined
