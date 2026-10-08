// Messages a project addon iframe can post to the page hosting it, so addons
// get the same details panel and player as the built-in pages:
//
//   window.parent.postMessage({ action: 'selection', entities }, origin)
//     what is selected in the addon, the open details panel follows it and
//     closes when the selection is empty
//   window.parent.postMessage({ action: 'open_details', entities }, origin)
//     open the details panel (comments, attributes) for these entities
//   window.parent.postMessage({ action: 'close_details' }, origin)
//   window.parent.postMessage({ action: 'open_player', target }, origin)
//     open the player, target is { versionId, productId, taskId, folderId }
//     with the ids that apply; a version needs its folderId or productId
//   window.parent.postMessage({ action: 'sidebar', visible }, origin)
//     show or hide the page's slicer, for views that have no use for it
//
// entities are [{ id, entityType }] in the current project.

import { RefObject, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAppDispatch } from '@state/store'
import { openViewer, ViewerState } from '@state/viewer'

export type AddonEntity = { id: string; entityType: string }

export type AddonPlayerTarget = {
  versionId?: string
  productId?: string
  taskId?: string
  folderId?: string
}

const isEntity = (e: any): e is AddonEntity =>
  !!e && typeof e.id === 'string' && typeof e.entityType === 'string'

const toEntities = (value: unknown): AddonEntity[] =>
  Array.isArray(value) ? value.filter(isEntity) : []

const toViewerPayload = (
  projectName: string,
  target: AddonPlayerTarget,
): Partial<ViewerState> | null => {
  // The viewer only opens for a folder, task or product. Like the tables, a
  // version opens its folder with that version selected, or its product.
  if (target.versionId) {
    const versionIds = [target.versionId]
    if (target.folderId) {
      return {
        projectName,
        quickView: true,
        folderId: target.folderId,
        selectedProductId: target.productId,
        versionIds,
      }
    }
    if (target.productId) {
      return { projectName, quickView: true, productId: target.productId, versionIds }
    }
    return null
  }
  if (target.taskId) return { projectName, quickView: true, taskId: target.taskId }
  if (target.folderId) return { projectName, quickView: true, folderId: target.folderId }
  if (target.productId) return { projectName, quickView: true, productId: target.productId }
  return null
}

export const useAddonMessages = (
  addonRef: RefObject<HTMLIFrameElement | null>,
  projectName: string,
  addonName: string,
) => {
  const dispatch = useAppDispatch()
  const [, setSearchParams] = useSearchParams()
  const [selection, setSelection] = useState<AddonEntity[]>([])
  const [isDetailsOpen, setDetailsOpen] = useState(false)
  const [isSidebarVisible, setSidebarVisible] = useState(true)
  const isOpenRef = useRef(false)
  isOpenRef.current = isDetailsOpen

  // The panel keeps its entity in the URL (?project&type&id) and removes it
  // with its own close button. Closing it from here has to do the same, or a
  // reload would reopen it.
  const closeDetails = useCallback(() => {
    if (!isOpenRef.current) return
    setDetailsOpen(false)
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)
        ;['project', 'type', 'id'].forEach((key) => params.delete(key))
        return params
      },
      { replace: true },
    )
  }, [setSearchParams])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      // only the addon iframe of this page
      if (event.origin !== window.location.origin) return
      if (!addonRef.current || event.source !== addonRef.current.contentWindow) return
      const data = event.data
      if (!data || typeof data !== 'object') return

      switch (data.action) {
        case 'selection': {
          const entities = toEntities(data.entities)
          setSelection(entities)
          if (!entities.length) closeDetails()
          break
        }
        case 'open_details': {
          const entities = toEntities(data.entities)
          if (!entities.length) break
          setSelection(entities)
          setDetailsOpen(true)
          break
        }
        case 'close_details':
          closeDetails()
          break
        case 'open_player': {
          const payload = toViewerPayload(projectName, data.target || {})
          if (payload) dispatch(openViewer(payload))
          break
        }
        case 'sidebar':
          setSidebarVisible(data.visible !== false)
          break
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [addonRef, projectName, dispatch, closeDetails])

  // a different project or addon starts closed, with the sidebar
  useEffect(() => {
    setSelection([])
    setDetailsOpen(false)
    setSidebarVisible(true)
  }, [projectName, addonName])

  return { selection, isDetailsOpen, closeDetails, isSidebarVisible }
}
