import ActivityReferenceTooltip from './components/ActivityReferenceTooltip'
import FileUploadPreview from './components/FileUploadPreview'
export * from './Feed'

export * from './components/FileUploadPreview'
export * from './components/ActivityCategorySelect'
export * from './context/feed'

export { ActivityReferenceTooltip, FileUploadPreview }

export {
  codeTag,
  inputTag,
  blockquoteTag,
} from './components/ActivityComment/ActivityMarkdownComponents'
export {
  default as remarkLiteralDirectives,
  COMMENT_DIRECTIVES,
} from './components/ActivityComment/remarkLiteralDirectives'

export * from './hooks/useTableKeyboardNavigation'

export type SavedAnnotationMetadata = {
  id: string
  composite: string
  transparent: string
  range: number[]
  activityId?: string
}
