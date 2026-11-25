import { Fragment, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'
import { useAppSelector } from '@state/store'
import {
  filterNavigation,
  findActiveItem,
  itemLandingPath,
  sortForSidebar,
  useNavAccess,
} from './filterNavigation'
import { useProjectNavigation } from './useProjectNavigation'
import { useStudioNavigation } from './useStudioNavigation'
import { useAdminNavigation } from './useSettingsNavigation'
import type { NavItem } from './types'
import * as Styled from './NavRail.styled'

// the project path a page is on: the project rail shows there, Home's rail everywhere else
const PROJECT_PATH = /^\/projects\/([^/]+)/

interface RailProps {
  items: NavItem[]
  /** pinned to the bottom, after the sections */
  bottom?: NavItem[]
}

const Rail = ({ items, bottom = [] }: RailProps) => {
  const { pathname } = useLocation()
  const access = useNavAccess()

  const sections = useMemo(() => {
    const visible = sortForSidebar(filterNavigation(items, access))
    // consecutive items of a section, a divider between sections
    return visible.reduce<NavItem[][]>((groups, item) => {
      const last = groups[groups.length - 1]
      if (last && last[0].section === item.section) last.push(item)
      else groups.push([item])
      return groups
    }, [])
  }, [items, access])
  const pinned = useMemo(() => filterNavigation(bottom, access), [bottom, access])
  const active = findActiveItem([...items, ...bottom], pathname)

  const renderItem = (item: NavItem) => {
    const isActive = item.id === active?.id
    // the selected item stays where it is: a click doesn't leave its current tab
    const to = isActive ? pathname + window.location.search : itemLandingPath(item, access)
    if (!to) return null
    return (
      <Styled.Item
        key={item.id}
        to={to}
        className={isActive ? 'active' : undefined}
        aria-current={isActive ? 'page' : undefined}
        aria-label={item.label}
        data-rail-item={item.id}
        data-tooltip={item.label}
        data-tooltip-position="right"
        {...item.tags}
      >
        <Icon icon={item.icon} />
        <Styled.Label>{item.label}</Styled.Label>
      </Styled.Item>
    )
  }

  return (
    <Styled.Rail aria-label="Sidebar" data-nav-rail>
      {sections.map((section, index) => (
        <Fragment key={section[0].section}>
          {index > 0 && <Styled.Divider />}
          {section.map(renderItem)}
        </Fragment>
      ))}
      <Styled.Spacer />
      {pinned.map(renderItem)}
    </Styled.Rail>
  )
}

const ProjectRail = ({ projectName }: { projectName: string }) => {
  const { items } = useProjectNavigation(projectName)
  const bottom: NavItem[] = useMemo(
    () => [
      {
        id: 'project-settings',
        label: 'Settings',
        icon: 'settings',
        section: 'admin',
        // the Project manager, on this project
        tabs: [
          {
            name: 'Project settings',
            path: `/manageProjects/projectSettings?project=${encodeURIComponent(projectName)}`,
            module: 'projectSettings',
          },
        ],
      },
    ],
    [projectName],
  )
  return <Rail items={items} bottom={bottom} />
}

const StudioRail = () => {
  const { items } = useStudioNavigation()
  const admin = useAdminNavigation()
  const all = useMemo(() => [...items, ...admin], [items, admin])
  return <Rail items={all} />
}

/**
 * The sidebar: the current context's places (a project's, or Home's), the selected one owning
 * the tab row. Signed-in users from the regular user level up; guests only get shared pages.
 */
export const NavRail = () => {
  const { pathname } = useLocation()
  const user = useAppSelector((state) => state.user)
  if (user.data?.isGuest || (user.uiExposureLevel ?? 0) < 500) return null

  const projectName = pathname.match(PROJECT_PATH)?.[1]
  if (projectName) return <ProjectRail projectName={decodeURIComponent(projectName)} />
  return <StudioRail />
}

export default NavRail
