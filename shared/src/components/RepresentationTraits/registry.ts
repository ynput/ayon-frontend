import type { ComponentType } from 'react'
import type { TraitDefinition } from '@shared/api'
import { FILE_LIST_VIEWS, SINGLE_FILE_VIEWS, TraitWidgetRegistry } from './utils/traitModel'
import { FileCardView, FilesStripView, FilesTableView } from './views/FilesViews'
import { FrameRangeTimelineView, ResolutionView } from './views/TimeAndImageViews'

export type TraitWidgetProps = {
  traitId: string
  data: unknown
  definition?: TraitDefinition
  // all traits of the same representation (or Bundle item), for views that combine traits
  traits?: Record<string, unknown>
}

// Views of traits, keyed by
// - the file views keys (`files:list`, `files:single`), for traits listed in FILE_TRAIT_LAYOUTS,
// - the versionless trait id,
// - or a `ui.widget` name of a definition.
// The first view is the default, the user can switch to the others; the schema-driven "Fields"
// view and the "Stored values" view are always added after them.
// `versions` limits a view to trait versions whose fields it reads. Views reading fields through
// the helpers of utils/traitFields handle the versions they know.
export const traitWidgets: TraitWidgetRegistry<ComponentType<TraitWidgetProps>> = {
  [FILE_LIST_VIEWS]: [
    { id: 'strip', label: 'Strip', icon: 'view_week', component: FilesStripView },
    { id: 'table', label: 'File list', icon: 'table_rows', component: FilesTableView },
  ],
  [SINGLE_FILE_VIEWS]: [
    { id: 'card', label: 'File', icon: 'description', component: FileCardView },
  ],
  'ayon.time.FrameRanged': [
    { id: 'timeline', label: 'Timeline', icon: 'linear_scale', component: FrameRangeTimelineView },
  ],
  'ayon.2d.PixelBased': [
    { id: 'resolution', label: 'Resolution', icon: 'aspect_ratio', component: ResolutionView },
  ],
}
