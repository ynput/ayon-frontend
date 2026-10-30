import type { SlotName } from './slots'

/** What tools and the generated AGENTS.md say about a slot, next to its types in SlotMap. */
export interface SlotDoc {
  /** the manifest helper */
  helper: string
  /** where it shows */
  where: string
  /** when its code loads */
  loads:
    | 'first shown'
    | 'with the page'
    | 'first click'
    | 'menu open / click'
    | 'first click (component: with the page)'
    | 'key press'
    | 'at startup'
}

export const SLOT_DOCS: { readonly [S in SlotName]: SlotDoc } = {
  'project.page': {
    helper: 'projectPage',
    where: "a tab on the project page, /projects/<project>/<id>",
    loads: 'first shown',
  },
  'studio.page': {
    helper: 'studioPage',
    where: "a tab on the dashboard, /dashboard/<id>",
    loads: 'first shown',
  },
  'header.item': {
    helper: 'headerItem',
    where: "an item in the main header, left (after Home) or right (before chat)",
    loads: 'first click (component: with the page)',
  },
  'detailsPanel.tab': {
    helper: 'detailsPanelTab',
    where: "a tab in the details panel, for the entity types listed",
    loads: 'first shown',
  },
  'detailsPanel.menuItem': {
    helper: 'detailsPanelMenuItem',
    where: "an item in the details panel's more menu",
    loads: 'menu open / click',
  },
  tableColumn: {
    helper: 'tableColumn',
    where: "a read-only column in the Overview, Products and Lists tables",
    loads: 'with the page',
  },
  entityMenuItem: {
    helper: 'entityMenuItem',
    where: "an item in the project tables' cell right-click menu, for the selected entities",
    loads: 'menu open / click',
  },
  'projectList.menuItem': {
    helper: 'projectListMenuItem',
    where: "an item in the project list's right-click menu and/or more dropdown",
    loads: 'menu open / click',
  },
  'slicer.menuItem': {
    helper: 'slicerMenuItem',
    where: "an item in the slicer's right-click menu and/or panel dropdown",
    loads: 'menu open / click',
  },
  'projectTable.toolbarItem': {
    helper: 'projectTableToolbarItem',
    where: "an item in the project tables' toolbar, before Customize",
    loads: 'first click (component: with the page)',
  },
  'projectTable.customizeSection': {
    helper: 'projectTableCustomizeSection',
    where: "a section in the project tables' Customize panel",
    loads: 'first shown',
  },
  'table.shortcut': {
    helper: 'tableShortcut',
    where: "a key pressed in a cell of the project tables or the slicer, project list, lists and versions tables",
    loads: 'key press',
  },
  'app.service': {
    helper: 'appService',
    where: "nowhere: code with no UI, mounted once while AYON is open",
    loads: 'at startup',
  },
}
