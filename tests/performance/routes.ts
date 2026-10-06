// Routes measured by pageLoad.perf.ts.
// `ready` lists selectors that must all be visible before the page counts as loaded; pick ones
// that only render once the page shows real data, not a skeleton. On top of that the full page
// loader must be gone and no `.loading` shimmer may be visible, held for PERF_SETTLE_MS.

export interface PerfRoute {
  name: string
  path: string
  ready: string[]
}

// a large project (thousands of folders and tasks) for the project pages
const project = process.env.PERF_PROJECT || 'demo_Big_Feature'
// a project that has lists and review sessions
const listsProject = process.env.PERF_LISTS_PROJECT || 'demo_Commercial'

// prettier-ignore
export const ROUTES: PerfRoute[] = [
  { name: 'home-tasks', path: '/dashboard/tasks', ready: ['#projects-list-menu', 'tbody tr', '#not_ready'] },
  { name: 'inbox', path: '/inbox/important', ready: ['[id^="message-"]'] },
  { name: 'projects-manager', path: '/manageProjects/anatomy', ready: ['tbody tr', '[data-schema-id="root_entity_naming"]'] },
  { name: 'project-overview', path: `/projects/${project}/overview`, ready: ['[id^="cell-"][id$="-name"]'] },
  { name: 'task-progress', path: `/projects/${project}/tasks`, ready: ['[id^="slicer-hierarchy-"]'] },
  { name: 'products', path: `/projects/${project}/products`, ready: ['[id^="cell-"][id$="-version"]'] },
  { name: 'lists', path: `/projects/${listsProject}/lists`, ready: ['#lists-table-menu', 'tbody tr'] },
  { name: 'reviews', path: `/projects/${listsProject}/reviews`, ready: ['#lists-table-menu', 'tbody tr'] },
  { name: 'workfiles', path: `/projects/${project}/workfiles`, ready: ['.p-treetable tbody tr'] },
  { name: 'settings-anatomy', path: '/settings/anatomyPresets', ready: ['[data-schema-id="root_entity_naming"]'] },
  { name: 'settings-users', path: '/settings/users', ready: ['.p-datatable tbody tr.p-selectable-row'] },
  { name: 'events', path: '/events', ready: ['.p-datatable tbody tr.p-selectable-row'] },
]
