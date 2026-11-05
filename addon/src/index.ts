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
  PopoverScope,
  PopoverButtonScope,
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
  TableColumnTag,
  ShortcutTable,
  TableRowRef,
  TableShortcutContext,
  TableShortcutMeta,
  TableShortcutPieces,
  AppServiceContext,
  AppServiceMeta,
  UserDetailsContext,
  UserDetailsMenuItemMeta,
  UserDetailsSectionMeta,
  UserSelection,
} from './slots'
export type {
  Access,
  AddonUser,
  EntityRef,
  EntityScope,
  FolderInfo,
  PageMeta,
  PageViews,
  ProjectPageMeta,
  ProjectFolders,
  ProjectFoldersScope,
  ProjectInfo,
  ProjectTablePage,
  ProjectNameScope,
  ProjectScope,
  SlicerScope,
  SlicerSelection,
  UserRef,
  UserScope,
  UsersScope,
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
export { refreshTableColumn, addonColumnId, ADDON_COLUMN_PREFIX } from './tableColumns'
export { entityUrl, navigateToEntity } from './entityLinks'
export type { EntityLinkRef, EntityUrlOptions } from './entityLinks'
// AYON's details panel and viewer, opened from addon code
export { closeDetails, openDetails, openViewer } from './openInHost'
export type { ViewerTarget } from './openInHost'

// layout: the host's slicer and project list, placed by the addon
export { ProjectList, ProjectPageLayout, Slicer, StudioPageLayout } from './layout'
export type {
  ProjectListProps,
  ProjectPageLayoutProps,
  SlicerProps,
  StudioPageLayoutProps,
} from './layout'

// AYON's entity picker, usable anywhere
export { EntityPicker } from './EntityPicker'
export type { EntityPickerProps, PickableEntityType } from './EntityPicker'
// AYON's project table for given rows, usable anywhere
export { EntityTable } from './EntityTable'
export type {
  EntityTableColumn,
  EntityTableEntityType,
  EntityTableFilter,
  EntityTableFilterCondition,
  EntityTableProps,
  EntityTableSettings,
} from './EntityTable'
// AYON's menu under a button, for an addon's own "more" actions
export { MoreMenu } from './MoreMenu'
export type { MoreMenuProps } from './MoreMenu'

// globals: the same in every slot
export { dispatch, navigate, useUser } from './globals'
export type { AddonDispatch } from './hostBridge'
// the host's router and toasts: an addon's own copies would have no router or container
export { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
export { toast } from 'react-toastify'
// query params in the URL, through the QueryParamProvider AYON renders around every slot: no
// provider or router adapter in the addon
export {
  useQueryParam,
  useQueryParams,
  withDefault,
  StringParam,
  NumberParam,
  BooleanParam,
  ArrayParam,
  NumericArrayParam,
  DelimitedArrayParam,
  DelimitedNumericArrayParam,
  ObjectParam,
  NumericObjectParam,
  JsonParam,
  DateParam,
  DateTimeParam,
  createEnumParam,
  createEnumArrayParam,
  createEnumDelimitedArrayParam,
} from 'use-query-params'
export type {
  QueryParamConfig,
  QueryParamConfigMap,
  QueryParamOptions,
  UrlUpdateType,
} from 'use-query-params'
