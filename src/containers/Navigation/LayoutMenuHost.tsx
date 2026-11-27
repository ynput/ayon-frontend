import type { FC } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { usePowerpack, useRemoteModules } from '@shared/context'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import { useAppDispatch, type AppDispatch } from '@state/store'

/** What the header hands the arranging addon's menu (`NavArrangement`). */
export interface LayoutMenuProps {
  /** the open project, if any */
  projectName?: string
  /** AYON's notifications (a module's own wouldn't show) */
  toast: typeof toast
  /** the app's store, for the views dialogs */
  dispatch: AppDispatch
  /** the app's router (a module's own isn't it) */
  navigate: (to: string) => void
}

const NoMenu: FC<LayoutMenuProps> = () => null

/**
 * The header's slot for the menu of the addon that arranges the navigation, before the icons:
 * which arrangement applies and what can be done with it are the addon's. Nothing without it.
 */
const LayoutMenuHost = () => {
  const { pathname } = useLocation()
  const match = pathname.match(/^\/projects\/([^/]+)/)
  const projectName = match ? decodeURIComponent(match[1]) : undefined
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const { powerLicense } = usePowerpack()
  // an addon without the menu doesn't list it: nothing is loaded. The menu goes with the module
  // that arranges the navigation (one that lists only the menu hands it other props)
  const { modules } = useRemoteModules()
  const provided = modules.some(
    (addon) =>
      addon.addonName === 'powerpack' &&
      !!addon.modules.views?.includes('LayoutMenu') &&
      !!addon.modules.views?.includes('NavigationLayouts'),
  )
  const [LayoutMenu] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'LayoutMenu',
    fallback: NoMenu,
    skip: !provided || !powerLicense,
  })
  if (!provided || !powerLicense) return null
  return (
    <LayoutMenu projectName={projectName} toast={toast} dispatch={dispatch} navigate={navigate} />
  )
}

export default LayoutMenuHost
