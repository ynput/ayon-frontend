import type { EntityRef, SlotName } from '@ynput/ayon-addon'
import { getRegistry, isKnownSlot } from '@ynput/ayon-addon/host'
import { decodeSceneValues, encodeSceneValues } from '../../src/contractPreviews'
import { normalizeParams } from './places'
import type { Place } from './places'
import type { ShellSelection } from './types'

// ?surface=details-panel&showAll=1&highlight=1&ctxProject=demo&ctxEntities=task:<id>
// Names of their own: AYON's surfaces keep their state in the URL too (project, type, id).
// `slot` and `contribution` are what `ayon-addon open` is about; the panel doesn't show them.
export const PARAMS = {
  surface: 'surface',
  slot: 'slot',
  id: 'contribution',
  showAll: 'showAll',
  highlight: 'highlight',
  project: 'ctxProject',
  projects: 'ctxProjects',
  entities: 'ctxEntities',
  entityType: 'ctxEntityType',
  page: 'ctxPage',
  sceneValues: 'ctxValues',
  user: 'ctxUser',
  preview: 'preview',
} as const

const PAGES = ['overview', 'products', 'lists'] as const

// AYON's slots, and those addons declare (the addon itself, its contract packages)
const isSlot = (slot: string) => isKnownSlot(slot) || getRegistry().slots.some((s) => s.name === slot)

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

/**
 * The selection in the URL. With the places, old links (`scene=`, `slot=&contribution=` without
 * `surface`, `showSlots=`, `showUnused=`, a renamed place) are read as what they meant.
 */
export const readSelection = (search = window.location.search, places?: readonly Place[]): ShellSelection => {
  const params = places ? normalizeParams(search, places) : new URLSearchParams(search)
  const slot = params.get(PARAMS.slot) || undefined
  const projectName = params.get(PARAMS.project) || undefined
  const page = params.get(PARAMS.page) as ShellSelection['page'] | null
  const entities = parseEntities(params.get(PARAMS.entities), projectName)
  const knownSlot = slot && isSlot(slot) ? (slot as SlotName) : undefined
  return {
    surface: params.get(PARAMS.surface) || undefined,
    slot: knownSlot,
    id: (knownSlot && params.get(PARAMS.id)) || undefined,
    showAll: params.get(PARAMS.showAll) === '1' || (!places && params.get('showUnused') === '1'),
    highlight: params.get(PARAMS.highlight) === '1',
    projectName,
    projectNames: params.get(PARAMS.projects)?.split(',').filter(Boolean),
    entityType: entities[0]?.entityType || params.get(PARAMS.entityType) || undefined,
    entities,
    page: page && PAGES.includes(page) ? page : undefined,
    sceneValues: decodeSceneValues(params.get(PARAMS.sceneValues)),
    userName: params.get(PARAMS.user) || undefined,
    preview: params.get(PARAMS.preview) || undefined,
  }
}

/** What moving around is (a new history entry); the rest are edits of the inputs (replaced). */
export const navigationKey = (selection: ShellSelection) => [selection.preview, selection.surface].join('\u0000')

/**
 * Puts the selection in the URL, leaving AYON's own parameters alone: a new history entry when
 * `push` (going to another place), else in place (inputs, switches).
 */
export const writeSelection = (selection: ShellSelection, push = false) => {
  const params = new URLSearchParams(window.location.search)
  const set = (name: string, value?: string) =>
    value ? params.set(name, value) : params.delete(name)
  // the old names, now read into the ones below
  params.delete('scene')
  params.delete('showSlots')
  params.delete('showUnused')
  set(PARAMS.preview, selection.preview)
  set(PARAMS.surface, selection.surface)
  set(PARAMS.slot, selection.slot)
  set(PARAMS.id, selection.id)
  set(PARAMS.showAll, selection.showAll ? '1' : undefined)
  set(PARAMS.highlight, selection.highlight ? '1' : undefined)
  set(PARAMS.project, selection.projectName)
  set(PARAMS.projects, selection.projectNames?.join(',') || undefined)
  set(PARAMS.page, selection.page)
  set(PARAMS.sceneValues, encodeSceneValues(selection.sceneValues))
  set(PARAMS.user, selection.userName)
  set(
    PARAMS.entities,
    selection.entities.map((entity) => `${entity.entityType}:${entity.id}`).join(',') || undefined,
  )
  set(PARAMS.entityType, selection.entities.length ? undefined : selection.entityType)
  const search = params.toString()
  const url = `${window.location.pathname}${search ? `?${search}` : ''}`
  if (url === `${window.location.pathname}${window.location.search}`) return
  if (push) window.history.pushState(window.history.state, '', url)
  else window.history.replaceState(window.history.state, '', url)
}

// A scene's input values per place, for this visit: the URL holds the current place's only, so
// going to another place and back finds them here.
const sceneValuesByPlace = new Map<string, Record<string, unknown> | undefined>()

export const rememberSceneValues = (surface: string | undefined, values?: Record<string, unknown>) => {
  if (surface) sceneValuesByPlace.set(surface, values)
}

export const rememberedSceneValues = (surface: string) => sceneValuesByPlace.get(surface)
