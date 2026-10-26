// Building blocks of slot contexts, so a field means the same in every slot that has it.

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
  entityType: string
  entities: EntityRef[]
}

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

/**
 * Slots whose component the host opens from a button it draws (header items, toolbar items).
 * The component loads on the first click and stays mounted; it shows itself while `open`.
 */
export interface PopupScope {
  open: boolean
  onClose: () => void
  /** the button, to anchor a popover to */
  anchor: HTMLElement | null
}

/** Who sees a page: everyone when not set. Admins see manager pages too. */
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
  access?: Access
  /** the view type its views are saved under, when the page uses views */
  viewType?: string
}
