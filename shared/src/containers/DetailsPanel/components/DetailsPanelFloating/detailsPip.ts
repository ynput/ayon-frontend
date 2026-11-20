// The picture-in-picture details panel is the app itself, loaded in an iframe at this path with
// only the panel on the page. An iframe has its own document, so the panel's dropdowns, menus,
// editor and tooltips work there as in the main window (they all render into `document`).
import { useCallback } from 'react'
import type { NavigateFunction, To } from 'react-router-dom'
import type { DetailsPanelEntityType } from '@shared/api'
import type { DetailsPanelPip } from '@shared/context'

export const DETAILS_PIP_PATH = '/details-pip'

// posted by the PiP page to the window that hosts its frame (DetailsPanelFloating), for what
// belongs in the main window: the viewer, and pages a link or button navigates to
export const DETAILS_PIP_MESSAGE = 'ayon:details-pip'
type DetailsPipAction = { action: 'open-viewer'; args: any } | { action: 'navigate'; to: To }
export type DetailsPipMessage = DetailsPipAction & { type: typeof DETAILS_PIP_MESSAGE }

export type DetailsPipEntities = Pick<DetailsPanelPip, 'entityType' | 'entities'>

export const isDetailsPipPage = () => window.location.pathname === DETAILS_PIP_PATH

const postToHost = (message: DetailsPipAction) =>
  window.parent.postMessage({ type: DETAILS_PIP_MESSAGE, ...message }, window.location.origin)

export const openViewerFromPip = (args: any) => postToHost({ action: 'open-viewer', args })

// useNavigate for the PiP page: the main window navigates, the PiP keeps the panel
export const usePipNavigate = (): NavigateFunction =>
  useCallback(((to: To | number) => {
    if (typeof to !== 'number') postToHost({ action: 'navigate', to })
  }) as NavigateFunction, [])

export const buildDetailsPipUrl = ({ entityType, entities }: DetailsPipEntities) => {
  const params = new URLSearchParams({
    entityType,
    entities: JSON.stringify(entities.map(({ id, projectName }) => ({ id, projectName }))),
  })
  return `${DETAILS_PIP_PATH}?${params}`
}

export const parseDetailsPipUrl = (search: string): DetailsPipEntities | null => {
  const params = new URLSearchParams(search)
  const entityType = params.get('entityType') as DetailsPanelEntityType | null
  try {
    const entities = JSON.parse(params.get('entities') || '[]')
    if (!entityType || !Array.isArray(entities)) return null
    const valid = entities.filter(
      (e): e is { id: string; projectName: string } =>
        typeof e?.id === 'string' && typeof e?.projectName === 'string',
    )
    return valid.length ? { entityType, entities: valid } : null
  } catch {
    return null
  }
}
