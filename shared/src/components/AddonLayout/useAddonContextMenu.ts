// The host's useContextMenu (@ynput/ayon-addon): an addon's menu items in AYON's right-click menu.
// Registered with provideHost by the app and the dev shell, which both mount ContextMenuProvider.
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { HostOpenContextMenu } from '@ynput/ayon-addon/host'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { toContextMenuItems, toMenuItems } from './AddonButtonHelpers'

export const useAddonContextMenu = (): HostOpenContextMenu => {
  const [open] = useCreateContextMenu()
  const navigate = useNavigate()
  return useCallback(
    (event, items, onError) => {
      event.stopPropagation()
      open(event, toContextMenuItems(toMenuItems(items, onError), navigate))
    },
    [open, navigate],
  )
}
