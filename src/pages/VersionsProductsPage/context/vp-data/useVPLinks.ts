import { useMemo } from 'react'
import type { EntityLink } from '@shared/api/queries/links/getEntityLinks'
import {
  LinksTableData,
  linksToTableData,
  useEntityLinks,
  useLinkColumnsVisibility,
} from '@shared/containers'
import { useProjectContext } from '@shared/context'
import type { ProductNodeExtended, VersionNodeExtended } from '../../util'

// converted per entity type, so one cache changing doesn't re-convert the others
const useTableLinks = (
  links: Map<string, EntityLink[]>,
  entityType: string,
  anatomy: Parameters<typeof linksToTableData>[2],
) =>
  useMemo(
    () =>
      new Map<string, LinksTableData>(
        Array.from(links, ([id, value]) => [id, linksToTableData(value, entityType, anatomy)]),
      ),
    [links, entityType, anatomy],
  )

type UseVPLinksProps = {
  projectName: string
  showGrid: boolean
  skip: boolean
  // loaded rows only
  versionsMap: Map<string, VersionNodeExtended>
  productsMap?: Map<string, ProductNodeExtended>
  entitiesMap: Map<string, VersionNodeExtended | ProductNodeExtended>
}

export const useVPLinks = ({
  projectName,
  showGrid,
  skip,
  versionsMap,
  productsMap,
  entitiesMap,
}: UseVPLinksProps) => {
  const { anatomy, linkTypes } = useProjectContext()
  const { onLinkColumnsVisibleChange, isLinkColumnShown } = useLinkColumnsVisibility(linkTypes)

  // the grid shows no link columns, but the on-screen flags outlive the unmounted table
  const showLinks = useMemo(
    () => ({
      version: !showGrid && isLinkColumnShown('primary', 'version'),
      product: !showGrid && isLinkColumnShown('primary', 'product'),
      folder: !showGrid && isLinkColumnShown('folder', 'folder'),
      task: !showGrid && isLinkColumnShown('task', 'task'),
      parentProduct: !showGrid && isLinkColumnShown('product', 'product'),
    }),
    [isLinkColumnShown, showGrid],
  )

  const linkEntityIds = useMemo(() => {
    const versionIds = new Set<string>()
    const productIds = new Set<string>()
    const folderIds = new Set<string>()
    const taskIds = new Set<string>()
    if (skip) return { versionIds, productIds, folderIds, taskIds }

    for (const version of versionsMap.values()) {
      if (showLinks.version) versionIds.add(version.id)
      if (showLinks.parentProduct) productIds.add(version.product.id)
      if (showLinks.folder) folderIds.add(version.product.folder.id)
      if (showLinks.task && version.task) taskIds.add(version.task.id)
    }
    for (const product of productsMap?.values() ?? []) {
      // a product row is its own entity in the "Product" parent link columns
      if (showLinks.product || showLinks.parentProduct) productIds.add(product.id)
      if (showLinks.folder) folderIds.add(product.folder.id)
    }
    return { versionIds, productIds, folderIds, taskIds }
  }, [skip, versionsMap, productsMap, showLinks])

  const versionsLinks = useEntityLinks({
    projectName,
    entityType: 'version',
    entityIds: linkEntityIds.versionIds,
  })
  const productsLinks = useEntityLinks({
    projectName,
    entityType: 'product',
    entityIds: linkEntityIds.productIds,
  })
  const foldersLinks = useEntityLinks({
    projectName,
    entityType: 'folder',
    entityIds: linkEntityIds.folderIds,
  })
  const tasksLinks = useEntityLinks({
    projectName,
    entityType: 'task',
    entityIds: linkEntityIds.taskIds,
  })

  // copy and paste read links from the editor entities, not from the display rows
  const entitiesMapWithLinks = useMemo(() => {
    if (!versionsLinks.links.size && !productsLinks.links.size) return entitiesMap
    const map = new Map(entitiesMap)
    for (const [id, entity] of entitiesMap) {
      const links =
        entity.entityType === 'version'
          ? versionsLinks.links.get(entity.id)
          : productsLinks.links.get(entity.id)
      if (links) map.set(id, { ...entity, links })
    }
    return map
  }, [entitiesMap, versionsLinks.links, productsLinks.links])

  const versionsTableLinks = useTableLinks(versionsLinks.links, 'version', anatomy)
  const productsTableLinks = useTableLinks(productsLinks.links, 'product', anatomy)
  const foldersTableLinks = useTableLinks(foldersLinks.links, 'folder', anatomy)
  const tasksTableLinks = useTableLinks(tasksLinks.links, 'task', anatomy)

  const linksMap = useMemo(
    () =>
      new Map([
        ...versionsTableLinks,
        ...productsTableLinks,
        ...foldersTableLinks,
        ...tasksTableLinks,
      ]),
    [versionsTableLinks, productsTableLinks, foldersTableLinks, tasksTableLinks],
  )

  const loadingLinksEntityIds = useMemo(
    () =>
      new Set([
        ...versionsLinks.loadingIds,
        ...productsLinks.loadingIds,
        ...foldersLinks.loadingIds,
        ...tasksLinks.loadingIds,
      ]),
    [
      versionsLinks.loadingIds,
      productsLinks.loadingIds,
      foldersLinks.loadingIds,
      tasksLinks.loadingIds,
    ],
  )

  const linkQueries = [versionsLinks, productsLinks, foldersLinks, tasksLinks]

  return {
    linksMap,
    loadingLinksEntityIds,
    onLinkColumnsVisibleChange,
    entitiesMap: entitiesMapWithLinks,
    linkQueries,
  }
}
