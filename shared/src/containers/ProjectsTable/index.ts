// The project list (AYON's dashboard, inbox, project manager and studio pages; the addon dev
// shell): ProjectsList is the table with its data, menus and dialogs, the app adds its routes and
// store through props. ProjectsTable is the table alone (also the projects page).
export { default as ProjectsTable } from './ProjectsTable'
export type { ProjectsTableProps } from './ProjectsTable'
export { MENU_ID as PROJECTS_LIST_MENU_ID } from './ProjectsListTableHeader'
export {
  default as buildProjectsTableData,
  PROJECT_FOLDER_ROW_ID_PREFIX,
  buildProjectFolderRowId,
  parseProjectFolderRowId,
} from './buildProjectsTableData'
export { default as ProjectsList } from './ProjectsList/ProjectsList'
export type { ProjectsListProps } from './ProjectsList/ProjectsList'
export { PROJECTS_LIST_WIDTH_KEY } from './ProjectsList/ProjectsListHelpers'
export { ProjectsListSplitter } from './ProjectsList/ProjectsList.styled'
export { ProjectFolderFormDialog } from './ProjectsList/ProjectFolderFormDialog'
export type { ProjectFolderFormData } from './ProjectsList/ProjectFolderFormDialog'
export { default as useProjectMenuController } from './ProjectsList/hooks/useProjectMenuController'
export type { Hidden as ProjectsListHidden } from './ProjectsList/hooks/useProjectsListMenuItems'
