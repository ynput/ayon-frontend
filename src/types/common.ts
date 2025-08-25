// Common type definitions to replace 'any' usage throughout the codebase

// Event handler types
export type EventHandler = (event: React.MouseEvent | React.KeyboardEvent) => void
export type FormEventHandler = (event: React.FormEvent) => void
export type InputChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void
export type SelectChangeHandler = (event: React.ChangeEvent<HTMLSelectElement>) => void

// Generic object types
export type GenericObject = Record<string, unknown>
export type StringRecord = Record<string, string>
export type NumberRecord = Record<string, number>
export type BooleanRecord = Record<string, boolean>

// API response types
export type ApiResponse<T = unknown> = {
  data?: T
  error?: string | Error
  status?: 'fulfilled' | 'rejected' | 'pending'
}

export type ApiError = {
  message: string
  status?: number
  code?: string
}

// Form and input types
export type FormValue = string | number | boolean | string[] | number[] | null | undefined
export type FormData = Record<string, FormValue>
export type FormField = {
  id: string
  key: string
  value: FormValue
}

// Dropdown and select types
export type DropdownOption = {
  id: string | number
  label: string
  value?: string | number
  disabled?: boolean
}

export type DropdownRef = {
  open: () => void
  close: () => void
  focus: () => void
}

// Context menu types
export type ContextMenuEvent = React.MouseEvent<HTMLElement>
export type MenuItem = {
  id: string
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  divider?: boolean
}

// PubSub message types
export type PubSubMessage = {
  topic: string
  data: unknown
  timestamp?: number
}

// File and upload types
export type FileUploadData = {
  file: File
  progress?: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  error?: string
}

// Viewer and media types
export type ViewerArgs = {
  entityId?: string
  versionId?: string
  projectName?: string
  folderId?: string
  taskId?: string
  productId?: string
}

// Entity types
export type EntityData = {
  id: string
  name: string
  type: string
  projectName?: string
  [key: string]: unknown
}

// Filter types
export type FilterCriteria = {
  field: string
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'in' | 'notIn' | 'gt' | 'lt' | 'gte' | 'lte'
  value: string | number | boolean | (string | number)[]
}

export type FilterFunction<T = unknown> = (value: unknown, item: T) => boolean

// State management types
export type AppState = {
  user: UserState
  project: ProjectState
  dashboard: DashboardState
  context: ContextState
  [key: string]: unknown
}

export type UserState = {
  name: string
  data: {
    isUser: boolean
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type ProjectState = {
  name: string
  [key: string]: unknown
}

export type DashboardState = {
  tasks: {
    selected: string[]
    [key: string]: unknown
  }
  [key: string]: unknown
}

export type ContextState = {
  menuOpen: string | null
  [key: string]: unknown
}

// Dispatch types
export type AppDispatch = (action: unknown) => void

// Component prop types
export type ComponentProps = {
  children?: React.ReactNode
  className?: string
  style?: React.CSSProperties
  [key: string]: unknown
}

// Hook return types
export type HookResult<T = unknown> = {
  data: T | undefined
  isLoading: boolean
  error: Error | null
  refetch?: () => void
}

// Utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}
