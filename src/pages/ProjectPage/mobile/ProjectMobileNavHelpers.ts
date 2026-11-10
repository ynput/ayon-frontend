import type { NavLinkItem } from '@containers/header/AppNavLinks'
import { isNavLinkVisible, type NavLinkAccess } from '@containers/header/AppNavLinksHelpers'

export type MobileNavPage = {
  module: string
  name: string
  path: string
  icon: string
}

const PINNED_MODULES = ['overview', 'lists', 'products']
const PINNED_COUNT = 3

const MODULE_ICONS: Record<string, string> = {
  overview: 'table_rows',
  tasks: 'checklist',
  browser: 'folder_open',
  products: 'inventory_2',
  lists: 'format_list_bulleted',
  reviews: 'play_circle',
  workfiles: 'description',
  scheduler: 'calendar_month',
  reports: 'bar_chart',
}

const FALLBACK_ICON = 'extension'

export const getMobileNavPages = (links: NavLinkItem[], access: NavLinkAccess): MobileNavPage[] =>
  links.flatMap((link) => {
    if (link.node || !link.path || !link.module || !isNavLinkVisible(link, access)) return []
    return [
      {
        module: link.module,
        name: link.name || link.module,
        path: link.path,
        icon:
          typeof link.icon === 'string' ? link.icon : MODULE_ICONS[link.module] ?? FALLBACK_ICON,
      },
    ]
  })

export const splitPinnedPages = (pages: MobileNavPage[]) => {
  const preferred = PINNED_MODULES.flatMap(
    (module) => pages.find((page) => page.module === module) ?? [],
  )
  const fillers = pages.filter((page) => !preferred.includes(page))
  const pinned = [...preferred, ...fillers].slice(0, PINNED_COUNT)
  const more = pages.filter((page) => !pinned.includes(page))
  return { pinned, more }
}
