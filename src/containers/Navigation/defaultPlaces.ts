import type { NavItem, NavSection } from './types'

/**
 * The places AYON's own addons keep on the sidebar whether or not they are here (Milan,
 * 2026-11-27), so the sidebar has the same shape in every studio and between Home and a project.
 * An addon that isn't in the bundle, or needs a licence the studio doesn't have, shows faded and
 * says why. Ids are the items' own, so arrangements treat a faded place as the item.
 */
export interface DefaultPlace {
  id: string
  /** the addon that fills it */
  addon: string
  label: string
  icon: string
  section: NavSection
  order?: number
  /** the item's page explains the addon when it is missing (its splash): the place still opens it */
  splash?: boolean
  /** on Home: the addon is here but has no studio page yet */
  comingSoon?: string
}

export const DEFAULT_PROJECT_PLACES: DefaultPlace[] = [
  {
    id: 'reviews',
    addon: 'review',
    label: 'Review',
    icon: 'play_circle',
    section: 'review',
    splash: true,
  },
  {
    id: 'scheduler',
    addon: 'planner',
    label: 'Schedule',
    icon: 'calendar_month',
    section: 'plan',
    order: 10,
    splash: true,
  },
  {
    id: 'addon:timetracker/time',
    addon: 'timetracker',
    label: 'Time',
    icon: 'timer',
    section: 'plan',
    order: 20,
  },
  {
    id: 'reports',
    addon: 'reports',
    label: 'Reports',
    icon: 'monitoring',
    section: 'plan',
    order: 30,
  },
  {
    id: 'addon:storyboards/storyboards',
    addon: 'storyboards',
    label: 'Storyboards',
    icon: 'movie',
    section: 'pipeline',
    order: 1,
  },
]

export const DEFAULT_STUDIO_PLACES: DefaultPlace[] = [
  {
    id: 'reviews',
    addon: 'review',
    label: 'Review',
    icon: 'play_circle',
    section: 'review',
    comingSoon: 'Studio-wide review is coming soon. For now, open a project to review in it.',
  },
  {
    id: 'group:planner/planner',
    addon: 'planner',
    label: 'Planner',
    icon: 'event_note',
    section: 'plan',
    order: 10,
    splash: true,
  },
  {
    id: 'addon:timetracker/time',
    addon: 'timetracker',
    label: 'Time',
    icon: 'timer',
    section: 'plan',
    order: 20,
  },
  {
    id: 'reports',
    addon: 'reports',
    label: 'Reports',
    icon: 'monitoring',
    section: 'plan',
    order: 30,
    comingSoon: 'Studio-wide reports are coming soon. For now, open a project to see its reports.',
  },
]

/**
 * The registry's items with AYON's places filled: a place whose addon isn't usable is faded and
 * says why (its splash page still opens, other places open nothing); one whose addon is here but
 * has no item in this context yet (`comingSoon`) is faded and says so. Places sit in their
 * section, by their order.
 */
export const withDefaultPlaces = (
  items: NavItem[],
  places: DefaultPlace[],
  unavailable: (addon: string, label: string) => string | null,
): NavItem[] => {
  const result = [...items]
  places.forEach((place) => {
    const reason = unavailable(place.addon, place.label)
    const index = result.findIndex((item) => item.id === place.id)
    if (index !== -1) {
      if (reason)
        result[index] = {
          ...result[index],
          disabled: reason,
          tabs: place.splash ? result[index].tabs : [],
        }
      return
    }
    const disabled = reason ?? place.comingSoon
    if (!disabled) return
    result.push({
      id: place.id,
      label: place.label,
      icon: place.icon,
      section: place.section,
      order: place.order,
      tabs: [],
      disabled,
    })
  })
  return result
}
