/**
 * Selected entity reference passed to the more-menu's "Add to list" sub-menu.
 */
export interface SelectedEntityRef {
  entityId: string
  entityType?: string
  // YN-0683 / issue #1947: review-session lists are skipped when no selected
  // version has reviewables. Optional because non-version selections never set it.
  hasReviewables?: boolean
}

/**
 * Normalized entity ref handed to `openAddToListDialog`. Mirrors the source
 * `ListEntityInput` (entityType present, may be undefined) so the app's context is
 * structurally assignable to this shared interface.
 */
export interface ListEntityRef {
  entityId: string
  entityType: string | undefined
  hasReviewables?: boolean
}

/**
 * Generic list shape produced by the project-lists context. Kept minimal — only the
 * fields the more-menu cares about. The full type lives in
 * `src/pages/ProjectListsPage/context/EntityListsContext.tsx`; we don't import it
 * directly because `shared/` cannot depend on `src/pages/`.
 */
export interface EntityList {
  id: string
  label?: string
  entityType?: string
  [key: string]: unknown
}

/**
 * Structural interface for the EntityLists context as consumed by the details-panel
 * more-menu. Shadows the public API surface of `EntityListsContextType` from
 * `src/pages/ProjectListsPage/context` without importing it (layering: shared → src
 * is forbidden). When the source type changes, update this interface to match.
 */
export interface DetailsPanelEntityListsContext {
  // gates the "Add to review list" item without preloading review lists
  hasReviewAddon?: boolean
  // opens the searchable add-to-list dialog (replaces the old nested submenu builders)
  openAddToListDialog?: (
    entityType: string,
    entities: ListEntityRef[],
    opts?: { isReview?: boolean },
  ) => void
}
