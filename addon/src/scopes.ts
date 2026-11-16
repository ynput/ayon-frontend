// Building blocks of slot contexts, so a field means the same in every slot that has it.
// Every slot's code gets `user`; slots about a project `projectName`; slots about entities
// `entities` (EntityRef). The shape is described once in the generated AGENTS.md.

/** The signed-in user, as addons see it: in every slot's context (`user`) and from `useUser`. */
export interface AddonUser {
  name: string
  fullName?: string
  email?: string
  /** admins, and service users (the server treats them as admins) */
  isAdmin: boolean
  /** managers and admins */
  isManager: boolean
  isGuest: boolean
  /** a service user: an API key session (services, agents, CI) */
  isService: boolean
  /** developer mode is on */
  isDeveloper: boolean
}

/** Every slot: the signed-in user. The host adds it; AYON renders addons only once signed in. */
export interface UserScope {
  user: AddonUser
}

/**
 * A project, as slots pass it. The fields addons can rely on; AYON passes the full project
 * model, so more may be there.
 */
export interface ProjectInfo {
  name: string
  code: string
  label?: string
  active?: boolean
  library?: boolean
  attrib?: Record<string, unknown>
  statuses?: { name: string; color?: string; icon?: string; state?: string; scope?: string[] }[]
  folderTypes?: { name: string; icon?: string; color?: string }[]
  taskTypes?: { name: string; icon?: string; color?: string; shortName?: string }[]
  tags?: { name: string; color?: string }[]
}

/** Slots that are about one project. */
export interface ProjectNameScope {
  projectName: string
}

/** Slots that are about one project, with the project itself. */
export interface ProjectScope extends ProjectNameScope {
  /** the project; `undefined` while it loads */
  project: ProjectInfo | undefined
}

/** An entity a slot is about: its id and type, and its name when the host has it. */
export interface EntityRef {
  id: string
  /** `folder`, `task`, `product`, `version`, `representation` */
  entityType: string
  projectName: string
  name?: string
  label?: string
}

/** Slots about one or more entities of one type. */
export interface EntityScope {
  /** the type of every entity in `entities` */
  entityType: string
  /** the entities the slot is about, e.g. the ones the details panel shows */
  entities: EntityRef[]
}

/**
 * A user a slot is about, e.g. one selected in Settings → Users. Not the signed-in user: that is
 * `user` in every slot.
 */
export interface UserRef {
  name: string
  fullName?: string
  email?: string
  /** the account is active (not disabled) */
  active: boolean
  isAdmin: boolean
  /** managers and admins */
  isManager: boolean
  isGuest: boolean
  /** a service user (API key) */
  isService: boolean
}

/** Slots about one or more users. */
export interface UsersScope {
  /** the users the slot is about, e.g. the ones selected in Settings → Users */
  users: UserRef[]
}

/** The project pages with a project table (ProjectTreeTable). */
export type ProjectTablePage = 'overview' | 'products' | 'lists'

/** What is selected in the project page's slicer. */
export interface SlicerSelection {
  /** `hierarchy`, `assignees`, `status`, `taskType`, ... */
  sliceType: string
  /** ids of the selected rows: folder ids for `hierarchy`, the values for the others */
  selection: string[]
}

/** Slots on a project page, which always has the host's slicer state (selection, per page). */
export interface SlicerScope {
  /** empty until the user selects something in a `<Slicer>` the page places */
  slicer: SlicerSelection
}

/** A folder of the project, as slots pass it. AYON passes its folder list item, so more may be there. */
export interface FolderInfo {
  id: string
  name: string
  label?: string
  folderType: string
  /** `/` separated names from the project root, e.g. `assets/characters/hero` */
  path: string
  /** unset for folders at the project root */
  parentId?: string
  /** names of the parents, from the project root */
  parents: string[]
  status: string
  tags?: string[]
  hasTasks?: boolean
  hasChildren?: boolean
  attrib?: Record<string, unknown>
}

/** The project's folders. The host loads them once per project, for every page of it. */
export interface ProjectFolders {
  /** every folder of the project; empty while they load */
  folders: FolderInfo[]
  /** true on the first load and when the project changes */
  isLoading: boolean
  getFolderById: (id: string) => FolderInfo | undefined
  /** ids of the folder's parents, nearest first */
  getParentFolderIds: (folderId: string) => string[]
  /** ids of every folder inside the given ones, and the given ones too with `includeSelf` */
  getChildFolderIds: (folderIds: string[], includeSelf?: boolean) => string[]
  /** the given folders, without those inside another one of them */
  getFolderIdsWithoutChildren: (folderIds: string[]) => string[]
}

/** Slots on a project page, which always has the project's folders. */
export interface ProjectFoldersScope {
  /** every folder of the project, with lookups for parents and children */
  projectFolders: ProjectFolders
}

/**
 * The views of a page with a `viewType`. The host shows the views menu (saved views, the user's
 * working view, sharing); the page reads the selected view's settings and saves changes here.
 */
export interface PageViews {
  /** the page's `viewType` */
  viewType: string
  /** settings of the selected view: the page decides their shape. `undefined` while loading */
  settings: Record<string, unknown> | undefined
  /** true until the selected view's settings have loaded: don't save before that */
  isLoading: boolean
  /**
   * Saves settings the user changed: they are merged into the selected view's settings and stored
   * in the user's working view, which becomes the selected view (as on the built-in pages).
   */
  updateSettings: (settings: Record<string, unknown>) => Promise<void>
}

/** Pages, which have views when their description sets `viewType`. */
export interface ViewsScope {
  /** `undefined` when the page's description has no `viewType` */
  views: PageViews | undefined
}

/**
 * Who sees a page: everyone when not set. The same check as `minExposureLevel`: `manager` is
 * `EXPOSURE.manager` (700), `admin` is `EXPOSURE.admin` (900), so admins see manager pages too.
 */
export type Access = 'manager' | 'admin'

/** Description of a page contribution (`project.page`, `studio.page`). */
export interface PageMeta {
  /**
   * The page's URL segment and tab id: `/projects/<project>/<id>`, `/dashboard/<id>`.
   * A built-in page with the same id wins.
   */
  id: string
  /** the tab label */
  title: string
  /**
   * `manager` or `admin`: the tab is hidden from everyone else, and its URL redirects them. A
   * shorthand for `minExposureLevel: EXPOSURE.manager` / `EXPOSURE.admin`; with both, the higher wins
   */
  access?: Access
  /**
   * Gives the page views: the host shows the views menu and the page gets `views` in its context.
   * The type its views are saved under, e.g. `budget`: letters, digits, `_`, `-` and `.`. It must
   * be the page's own: one AYON or another page already uses is not shown.
   */
  viewType?: string
}

/** Description of a `project.page` contribution: a page, and what the host adds around it. */
export interface ProjectPageMeta extends PageMeta {
  /**
   * Shows AYON's details panel next to the page, for the page to open with `openDetails`. The page
   * is in a splitter while the panel is there; it only shows when the page opens it.
   */
  detailsPanel?: boolean
}

/** A condition of a server filter, as AYON's REST and GraphQL queries take it. */
export interface QueryCondition {
  /** the field, e.g. `status`, `taskType`, `attrib.priority`, `tags` */
  key: string
  value?: string | number | boolean | null | string[] | number[]
  /** `eq` when not set */
  operator?:
    | 'eq'
    | 'like'
    | 'notlike'
    | 'lt'
    | 'gt'
    | 'lte'
    | 'gte'
    | 'ne'
    | 'isnull'
    | 'notnull'
    | 'in'
    | 'notin'
    | 'includes'
    | 'excludes'
    | 'includesall'
    | 'excludesall'
    | 'includesany'
    | 'excludesany'
}

/** A server filter: conditions and nested filters, joined by `operator` (`and` when not set). */
export interface QueryFilter {
  conditions?: (QueryCondition | QueryFilter)[]
  operator?: 'and' | 'or'
}

/** A table's grouping: the field the rows are grouped by. */
export interface TableGroupBy {
  /** `status`, `taskType`, `assignees`, `attrib.<name>`, ... */
  id: string
  desc: boolean
}

/** The entities a project table filters by. */
export type TableFilterEntity = 'folder' | 'task' | 'product' | 'version' | 'representation'

/** Products: the version query arguments that are not filter conditions, named like GraphQL `versions`. */
export interface VersionQueryArgs {
  /** only these featured versions of each product; send `featuredOnlyEntityType: 'product'` with it */
  featuredOnly?: ('hero' | 'latestDone' | 'latest')[]
  /** only the latest version in each folder */
  latestPerFolder?: boolean
  /** only versions with (`true`) or without (`false`) reviewables */
  hasReviewables?: boolean
}

/** What a project table shows right now, as the host queries it. */
export interface ProjectTableState {
  /** the rows: `task` on Overview, `version` on Products */
  entityType: 'task' | 'version'
  /**
   * the filter bar and every slicer panel, one filter per entity, keys without a scope prefix and
   * relative dates resolved; an entity without conditions is left out
   */
  filters: Partial<Record<TableFilterEntity, QueryFilter>>
  /** name search: comma-separated terms, OR-ed; Overview only */
  search?: string
  /**
   * the folders the rows are in (hierarchy panel, pinned slice, list panel folders, folder
   * search), with all their descendants; can be thousands. `undefined`: no folder restriction
   */
  folderIds?: string[]
  /**
   * entities picked in a lists slicer panel, already narrowed to `folderIds`. Products sends
   * `version` or `product`, not both, as its query does
   */
  ids?: Partial<Record<'task' | 'product' | 'version', string[]>>
  /**
   * Overview: the folder tree; false for a flat task list, the flat folder view and a grouping.
   * Products: products with their versions
   */
  showHierarchy: boolean
  /** the grouping; `undefined` when not grouped */
  groupBy?: TableGroupBy
  /**
   * query arguments that are not filter conditions, per entity like `filters`: Products sets
   * `version`. `undefined` when none is set
   */
  queryArgs?: { version?: VersionQueryArgs }
}

/** Project table slots: what the table shows. */
export interface ProjectTableScope {
  /** Overview and Products; `undefined` on the Lists page, in the panels' tables and on older hosts */
  tableState?: ProjectTableState
}
