import { ReleaseListItemModel } from '@api/rest/releases'
import { MarketListItem } from '../MarketAddonsList'
import { createReleaseSubtitle } from '@containers/ReleaseInstallerDialog/helpers'
import { FilterCriteria, filterItems } from './filterItems'

export const transformReleasesToTable = (
  releases: ReleaseListItemModel[],
  hasCloud: boolean,
  filter: FilterCriteria[],
): MarketListItem[] => {
  const releaseGroups: MarketListItem[] = []

  const sortedReleases = [...releases].sort((a, b) => b.name.localeCompare(a.name))

  const filteredReleases = filter.length ? filterItems(releases, filter) : sortedReleases

  // group releases by name split by '-' (first bit is the name)
  filteredReleases.forEach((release) => {
    const [name] = release.name.split('-')
    const foundGroup = releaseGroups.find((item) => item.group?.id === name)
    const releaseItem: MarketListItem['items'][0] = {
      name: release.name,
      title: release.name,
      isDownloaded: false,
      isOfficial: true,
      isVerified: true,
      isProductionOutdated: false,
      isActive: release.isLatest || hasCloud,
      subTitle: createReleaseSubtitle({ createdAt: release.createdAt }),
      icon: release.icon,
    }
    if (foundGroup) {
      foundGroup.items.push(releaseItem)
    } else {
      const group: MarketListItem['group'] = {
        id: name,
        title: `${name} ${release.isLatest ? ' - Latest' : ''}`,
        isOfficial: true,
        isVerified: true,
        createdAt: createReleaseSubtitle({ createdAt: release.createdAt }),
      }
      releaseGroups.push({
        type: 'release',
        group,
        items: [releaseItem],
      })
    }
  })

  return releaseGroups
}
