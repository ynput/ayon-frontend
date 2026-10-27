import type { MenuItemPosition } from './slots'

interface Placed {
  position?: MenuItemPosition
  order?: unknown
}

const orderOf = (item: Placed) => (typeof item.order === 'number' ? item.order : 0)

/**
 * The menu item contributions for one place in a menu: `top` (first) or `bottom` (after the menu's
 * own items, above Delete), sorted by `order`. Items with the same order keep the registry order.
 */
export const menuItemsAt = <C extends Placed>(items: readonly C[], position: MenuItemPosition) =>
  items
    .filter((item) => (item.position === 'top' ? 'top' : 'bottom') === position)
    // Array.prototype.sort is stable, so equal orders stay in registry order
    .sort((a, b) => orderOf(a) - orderOf(b))
