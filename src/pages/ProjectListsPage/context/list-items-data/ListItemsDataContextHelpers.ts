import { VisibilityState } from '@tanstack/react-table'
import {
  DEFAULT_COLUMNS_FOLDER,
  DEFAULT_COLUMNS_PRODUCT,
  DEFAULT_COLUMNS_TASK,
  DEFAULT_COLUMNS_VERSION,
} from '@pages/ProjectsPage/constants'

export const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  'link_*': false,
  tags: true,
}

export const DEFAULT_COLUMNS_BY_TYPE: Record<string, VisibilityState> = {
  folder: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_FOLDER },
  task: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_TASK },
  version: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_VERSION },
  product: { ...DEFAULT_COLUMN_VISIBILITY, ...DEFAULT_COLUMNS_PRODUCT },
}
