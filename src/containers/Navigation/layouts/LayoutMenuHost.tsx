import type { FC } from 'react'
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
  const [LayoutMenu] = useLoadModule({
    addon: 'powerpack',
    remote: 'views',
    module: 'LayoutMenu',
    fallback: NoMenu,
    // a Power Pack without the menu doesn't list it: nothing is loaded
    skip: !props,
  })
  if (!props) return null
  return <LayoutMenu {...props} />
}

export default LayoutMenuHost
