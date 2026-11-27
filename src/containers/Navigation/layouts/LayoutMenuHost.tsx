import type { FC } from 'react'
import { useRemoteModules } from '@shared/context'
import { useLoadModule } from '@shared/hooks/useLoadModule'
import { useLayoutMenu } from './useLayoutMenu'
import type { LayoutMenuProps } from './types'

const NoMenu: FC<LayoutMenuProps> = () => null

/**
 * The layout menu in the header: Power Pack's, with the layouts and what can be done with them.
 * Nothing without the licence or a Power Pack that has the menu.
 */
const LayoutMenuHost = () => {
  const props = useLayoutMenu()
  // a Power Pack without the menu doesn't list it: nothing is loaded
  const { modules } = useRemoteModules()
  const provided = modules.some(
    (addon) => addon.addonName === 'powerpack' && addon.modules.views?.includes('LayoutMenu'),
  )
  const [LayoutMenu] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'LayoutMenu',
    fallback: NoMenu,
    skip: !props || !provided,
  })
  if (!props || !provided) return null
  return <LayoutMenu {...props} />
}

export default LayoutMenuHost
