// Links to an entity in AYON: the project page that shows it, with the entity selected and its
// details panel open. AYON's own links and addons' come from here, so they follow AYON's routes.
import { getHost } from './hostBridge'
import type { EntityRef } from './scopes'

/** The project page each entity type opens on. Other types (e.g. `workfile`) have no link. */
const ENTITY_PAGES: Record<string, string> = {
  folder: 'overview',
  task: 'overview',
  product: 'products',
  version: 'products',
  representation: 'products',
}

/** What a link needs of an entity: any `EntityRef` from a slot's context works. */
export type EntityLinkRef = Pick<EntityRef, 'projectName' | 'entityType' | 'id'>

export interface EntityUrlOptions {
  /** an activity (e.g. a comment) to highlight in the entity's feed */
  activity?: string
}

/**
 * The AYON URL (relative, e.g. `/projects/demo/overview?project=demo&type=task&id=…`) that opens
 * the entity: folders and tasks on Overview, products, versions and representations on Products.
 * The id is enough, the page finds the entity's parents. `undefined` for entity types AYON has no
 * page for. For a link to share: `new URL(entityUrl(entity)!, window.location.origin).href`.
 */
export const entityUrl = (
  entity: EntityLinkRef,
  options: EntityUrlOptions = {},
): string | undefined => {
  const page = ENTITY_PAGES[entity.entityType]
  if (!page || !entity.projectName || !entity.id) return undefined
  const params = new URLSearchParams({
    project: entity.projectName,
    type: entity.entityType,
    id: entity.id,
  })
  if (options.activity) params.set('activity', options.activity)
  return `/projects/${encodeURIComponent(entity.projectName)}/${page}?${params}`
}

/**
 * Opens the entity in AYON (`entityUrl`) without reloading the page. Works anywhere, also in
 * `run` and `menu` pieces. Returns `false`, and does nothing, for entity types AYON has no page for.
 */
export const navigateToEntity = (entity: EntityLinkRef, options?: EntityUrlOptions): boolean => {
  const url = entityUrl(entity, options)
  if (!url) return false
  const navigate = getHost().navigate
  if (navigate) navigate(url)
  else window.location.assign(url)
  return true
}
