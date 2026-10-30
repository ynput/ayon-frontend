// The project list's table (AYON's dashboard, inbox and projects page; the addon dev shell). The
// app's ProjectsList puts its data, menus and dialogs around it.
export { default as ProjectsTable } from './ProjectsTable'
export type { ProjectsTableProps } from './ProjectsTable'
export { MENU_ID as PROJECTS_LIST_MENU_ID } from './ProjectsListTableHeader'
export {
  default as buildProjectsTableData,
  PROJECT_FOLDER_ROW_ID_PREFIX,
  buildProjectFolderRowId,
  parseProjectFolderRowId,
} from './buildProjectsTableData'
