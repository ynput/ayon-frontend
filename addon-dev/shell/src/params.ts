import type { EntityRef, SlotName } from '@ynput/ayon-addon'
import { isKnownSlot } from '@ynput/ayon-addon/host'
import type { ShellSelection } from './types'

// ?slot=detailsPanel.tab&contribution=comments&ctxProject=demo&ctxEntities=task:<id>,task:<id>
// Names of their own: AYON's surfaces keep their state in the URL too (project, type, id).
export const PARAMS = {
  slot: 'slot',
  id: 'contribution',
  project: 'ctxProject',
  projects: 'ctxProjects',
  entities: 'ctxEntities',
  entityType: 'ctxEntityType',
  page: 'ctxPage',
  preview: 'preview',
} as const

const PAGES = ['overview', 'products', 'lists'] as const

const parseEntities = (value: string | null, projectName?: string): EntityRef[] =>
  (value || '')
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const [entityType, id, ...name] = part.split(':')
      if (!entityType || !id || !projectName) return []
      return [{ entityType, id, projectName, name: name.join(':') || undefined }]
    })

export const readSelection = (search = window.location.search): ShellSelection => {
  const params = new URLSearchParams(search)
  const slot = params.get(PARAMS.slot) || undefined
  const projectName = params.get(PARAMS.project) || undefined
  const page = params.get(PARAMS.page) as ShellSelection['page'] | null
  const entities = parseEntities(params.get(PARAMS.entities), projectName)
  return {
    slot: slot && isKnownSlot(slot) ? (slot as SlotName) : undefined,
    id: params.get(PARAMS.id) || undefined,
    projectName,
    projectNames: params.get(PARAMS.projects)?.split(',').filter(Boolean),
    entityType: entities[0]?.entityType || params.get(PARAMS.entityType) || undefined,
    entities,
    page: page && PAGES.includes(page) ? page : undefined,
    preview: params.get(PARAMS.preview) || undefined,
  }
}

/** Puts the selection in the URL, leaving AYON's own parameters alone. */
export const writeSelection = (selection: ShellSelection) => {
  const params = new URLSearchParams(window.location.search)
  const set = (name: string, value?: string) =>
    value ? params.set(name, value) : params.delete(name)
  set(PARAMS.preview, selection.preview)
  set(PARAMS.slot, selection.slot)
  set(PARAMS.id, selection.id)
  set(PARAMS.project, selection.projectName)
  set(PARAMS.projects, selection.projectNames?.join(',') || undefined)
  set(PARAMS.page, selection.page)
  set(
    PARAMS.entities,
    selection.entities.map((entity) => `${entity.entityType}:${entity.id}`).join(',') || undefined,
  )
  set(PARAMS.entityType, selection.entities.length ? undefined : selection.entityType)
  const search = params.toString()
  window.history.replaceState(
    window.history.state,
    '',
    `${window.location.pathname}${search ? `?${search}` : ''}`,
  )
}
