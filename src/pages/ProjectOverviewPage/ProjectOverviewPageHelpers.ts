import { buildScopes } from '@shared/components'

// the tasks resolver task filter does not whitelist folder_type — use the
// folder-scope folderType chip instead (goes through folderFilter)
export const OVERVIEW_FILTER_SCOPES = buildScopes(['task', 'folder'], { task: ['folderType'] })
