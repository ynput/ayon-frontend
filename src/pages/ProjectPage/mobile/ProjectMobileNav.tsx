import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import { useNavLinkAccess } from '@containers/header/AppNavLinksHelpers'
import { useDetailsPanelEntityContext } from '@shared/containers/ProjectTreeTable'
import MobileBottomBar from '@containers/MobileShell/MobileBottomBar'
import * as Styled from '@containers/MobileShell/MobileShell.styled'
import { SHEET_MASK_STYLE } from '@containers/MobileShell/MobileShellHelpers'
import { getMobileNavPages, splitPinnedPages } from './ProjectMobileNavHelpers'

type Props = {
  links: NavLinkItem[]
  currentModule: string
}

const ProjectMobileNav = ({ links, currentModule }: Props) => {
  const { manager, admin } = useNavLinkAccess()
  const { selectedEntity } = useDetailsPanelEntityContext()
  const [isMoreOpen, setIsMoreOpen] = useState(false)

  const { pinned, more } = useMemo(
    () => splitPinnedPages(getMobileNavPages(links, { manager, admin })),
    [links, manager, admin],
  )

  // the mobile Overview shows task details full screen
  if (currentModule === 'overview' && selectedEntity) return null

  const isMoreActive = !pinned.some((page) => page.module === currentModule)
  const closeMore = () => setIsMoreOpen(false)

  return (
    <MobileBottomBar>
      {pinned.map((page) => {
        const isActive = page.module === currentModule
        return (
          <Styled.BarLink key={page.module} to={page.path} className={clsx({ active: isActive })}>
            <Icon icon={page.icon} filled={isActive} />
            <span>{page.name}</span>
          </Styled.BarLink>
        )
      })}
      <Styled.BarButton
        type="button"
        className={clsx({ active: isMoreActive })}
        onClick={() => setIsMoreOpen(true)}
      >
        <Icon icon="more_horiz" filled={isMoreActive} />
        <span>More</span>
      </Styled.BarButton>
      <Styled.Sheet
        position="bottom"
        visible={isMoreOpen}
        onHide={closeMore}
        showCloseIcon={false}
        blockScroll
        maskStyle={SHEET_MASK_STYLE}
      >
        {more.map((page) => (
          <Styled.SheetLink
            key={page.module}
            to={page.path}
            className={clsx({ active: page.module === currentModule })}
            onClick={closeMore}
          >
            <Icon icon={page.icon} />
            <span>{page.name}</span>
          </Styled.SheetLink>
        ))}
      </Styled.Sheet>
    </MobileBottomBar>
  )
}

export default ProjectMobileNav
