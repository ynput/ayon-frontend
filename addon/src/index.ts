// @ynput/ayon-addon: the public API for addon frontends.
// Inside AYON this is always AYON's own copy (addons list it in their federation `shared` with
// `import: false`), so everything here works in every slot. What depends on the slot comes only
// from useSlot / the props of the contribution's component.

// slots and manifests (the manifest itself uses @ynput/ayon-addon/manifest, see there)
export type {
  Loader,
  SlotContext,
  SlotMap,
  SlotName,
  SlotProps,
  StudioPageContext,
  HeaderItemContext,
  HeaderItemMeta,
  DetailsPanelTabContext,
  DetailsPanelTabMeta,
  DetailsPanelMenuItemContext,
  DetailsPanelMenuItemMeta,
  MenuItemMeta,
  MenuItemPosition,
  AddonMenuItem,
  ButtonMeta,
  ButtonPieces,
  ButtonScope,
  DialogScope,
  MenuPiece,
  RunPiece,
  ListMenuItemMeta,
  MenuKind,
  ProjectListMenuItemContext,
  ProjectTableCustomizeSectionContext,
  ProjectTableCustomizeSectionMeta,
  ProjectTableToolbarItemContext,
  ProjectTableToolbarItemMeta,
  SlicerMenuItemContext,
  SlicerMenuItemMeta,
  SlicerRowRef,
  EntityMenuItemContext,
  EntityMenuItemMeta,
  TableCellContext,
  TableColumnFetch,
  TableColumnFetchArgs,
  TableColumnMeta,
  ShortcutTable,
  TableRowRef,
  TableShortcutContext,
  TableShortcutMeta,
  TableShortcutPieces,
} from './slots'
export type {
  Access,
  AddonUser,
  EntityRef,
  EntityScope,
  FolderInfo,
  PageMeta,
  PageViews,
  ProjectFolders,
  ProjectFoldersScope,
  ProjectInfo,
  ProjectTablePage,
  ProjectNameScope,
  ProjectScope,
  SlicerScope,
  SlicerSelection,
  UserScope,
  ViewsScope,
} from './scopes'
export type {
  AddonInfo,
  AddonManifest,
  AnyContribution,
  Contribution,
  ContributionFields,
  ContributionInput,
} from './contributions'
export { useSlot } from './useSlot'
export { useContributions } from './registry'
export type { ContributionsResult } from './registry'
export { ContributionView, ContributionErrorBoundary } from './ContributionView'
export type { ContributionViewProps } from './ContributionView'
export { prefetchPiece, runContribution } from './pieces'
export { refreshTableColumn } from './tableColumns'

// layout: the host's slicer and project list, placed by the addon
export { ProjectList, ProjectPageLayout, Slicer, StudioPageLayout } from './layout'
export type {
  ProjectListProps,
  ProjectPageLayoutProps,
  SlicerProps,
  StudioPageLayoutProps,
} from './layout'

// globals: the same in every slot
export { dispatch, useUser } from './globals'
export type { AddonDispatch } from './hostBridge'
// the host's router and toasts: an addon's own copies would have no router or container
export { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
export { toast } from 'react-toastify'
