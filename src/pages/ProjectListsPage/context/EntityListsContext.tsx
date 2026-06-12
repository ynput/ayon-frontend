import { createContext, useContext, ReactNode, useCallback, useMemo, useState } from 'react'
import useGetListsData, { UseGetListsDataReturn } from '../hooks/useGetListsData'
import { ListEntityType, listEntityTypes } from '../components/NewListDialog/NewListDialog'
import { toast } from 'react-toastify'
import { getEntityTypeIcon } from '@shared/util'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import {
  useUpdateEntityListItemsMutation,
  EntityList,
  useCreateEntityListMutation,
  EntityListFolderModel,
  useGetEntityListFoldersQuery,
  useExecuteActionMutation,
  entityListsQueriesGql,
} from '@shared/api'
import { upperFirst } from 'lodash'
import { useSearchParams } from 'react-router-dom'
import { usePowerpack } from '@shared/context'
import { useGetProductionAddon } from '@shared/hooks'
import { useAppDispatch } from '@state/store'

const MIN_REVIEW_VERSION = '0.0.3'
const MIN_REVIEW_ACTIONS_VERSION = '0.5.0'

interface EntityListsContextProps {
  projectName: string
}

// Define a new interface for the newListData state
interface NewListData {
  entityType: ListEntityType
  selectedEntities: ListEntityInput[]
  entityListType?: string
}

type ListSubMenuItem = {
  id: string
  label: string
  icon?: string
  command?: () => void
  items?: ListSubMenuItem[]
  disabled?: boolean
  hidden?: boolean
}

export type ListEntityInput = {
  entityId: string
  entityType: string | undefined
  hasReviewables?: boolean
}

export interface EntityListsContextType {
  allLists: UseGetListsDataReturn
  folders: EntityList[]
  tasks: EntityList[]
  products: EntityList[]
  versions: EntityList[]
  reviews: EntityList[]
  addToList: (listId: string, entityType: string, entities: ListEntityInput[]) => Promise<void>
  menuItems: (filter?: (item: ListSubMenuItem) => boolean) => ContextMenuItemConstructor
  buildListMenuItem: (
    list: EntityList,
    selected: ListEntityInput[],
    showIcon?: boolean,
    disabled?: boolean,
    overrideEntityType?: string,
  ) => ListSubMenuItem
  buildAddToListMenu: (
    items: ListSubMenuItem[],
    menu?: { label?: string },
  ) => {
    id: string
    label: string
    icon: string
    items: ListSubMenuItem[]
  }
  newListMenuItem: (entityType: ListEntityType, selected: ListEntityInput[]) => ListSubMenuItem
  // Update the type of newListData
  newListData: NewListData | null
  // Update the signature of openCreateNewList
  openCreateNewList: (
    entityType: ListEntityType,
    selectedEntities: ListEntityInput[],
    entityListType?: string,
  ) => void
  closeCreateNewList: () => void
  // Remove entities parameter as it will be stored in newListData
  createNewList: (label: string) => Promise<void>
  newListErrorMessage?: string
  // Build hierarchical menu items for arbitrary list collections (folders grouping)
  buildHierarchicalMenuItems: (
    lists: EntityList[],
    selected: ListEntityInput[],
    getShowIcon?: (list: EntityList) => boolean,
    getDisabled?: (list: EntityList) => boolean,
    overrideEntityType?: string,
  ) => ListSubMenuItem[]
  // Build the full ["Add to list", "Review"] top-level menu items
  buildReviewContextMenu: (
    entityType: ListEntityType,
    entities: ListEntityInput[],
    label?: string,
    filter?: (item: ListSubMenuItem) => boolean,
  ) => any[]
}

const EntityListsContext = createContext<EntityListsContextType | undefined>(undefined)

interface EntityListsProviderProps extends EntityListsContextProps {
  children: ReactNode
}

export const EntityListsProvider = ({ children, projectName }: EntityListsProviderProps) => {
  const dispatch = useAppDispatch()
  const { powerLicense } = usePowerpack()
  const [, setSearchParams] = useSearchParams()

  // Fetch all lists without filters and split on client
  const allLists = useGetListsData({
    projectName,
    filters: [],
    skip: !projectName,
  })

  // Derive individual lists by filtering on client
  const folders = useMemo(
    () => allLists.data.filter((list) => list.entityType === 'folder'),
    [allLists.data],
  )

  const tasks = useMemo(
    () => allLists.data.filter((list) => list.entityType === 'task'),
    [allLists.data],
  )

  const products = useMemo(
    () => allLists.data.filter((list) => list.entityType === 'product'),
    [allLists.data],
  )

  const versions = useMemo(
    () =>
      allLists.data.filter(
        (list) => list.entityType === 'version' && list.entityListType === 'generic',
      ),
    [allLists.data],
  )

  const reviews = useMemo(
    () =>
      allLists.data.filter(
        (list) => list.entityType === 'version' && list.entityListType === 'review-session',
      ),
    [allLists.data],
  )

  // fetch list folders to build hierarchy (only needed when power license)
  const { data: listFoldersAll = [] } = useGetEntityListFoldersQuery(
    { projectName },
    { skip: !projectName || !powerLicense },
  )

  // no filtering by scope here (UI using this context is overview page)
  const listFolders = listFoldersAll as EntityListFolderModel[]

  const { getProductionAddon } = useGetProductionAddon()

  const hasReviewAddon = !!getProductionAddon('review', { minVersion: MIN_REVIEW_VERSION })
  const hasReviewActionsVersion = !!getProductionAddon('review', {
    minVersion: MIN_REVIEW_ACTIONS_VERSION,
  })
  const reviewAddonVersion = getProductionAddon('review')?.productionVersion

  const [updateEntityListItems] = useUpdateEntityListItemsMutation()
  const [executeAction] = useExecuteActionMutation()

  // add an item to a list
  const addToList: EntityListsContextType['addToList'] = useCallback(
    async (listId, entityType, entities) => {
      // check the entity type is valid
      if (!listEntityTypes.includes(entityType as ListEntityType)) {
        toast.error('Invalid entity type')
        return Promise.reject(new Error('Invalid entity type'))
      }

      // filter out entities that do not match entityType
      let filteredEntities = entities.filter((entity) => entity.entityType === entityType)

      // Review sessions logic
      const targetList = allLists.data.find((l) => l.id === listId)
      const isReviewSession = targetList?.entityListType === 'review-session'

      if (isReviewSession && (entityType === 'folder' || entityType === 'task')) {
        if (!reviewAddonVersion) {
          toast.error('Review addon not available')
          return Promise.reject(new Error('Review addon not available'))
        }

        if (!hasReviewActionsVersion) {
          toast.error(
            `Please upgrade Review addon to at least ${MIN_REVIEW_ACTIONS_VERSION} to use this feature with folders and tasks`,
          )
          return Promise.reject(new Error('Review addon version too low'))
        }

        try {
          const actionIdentifier = `review-add-to-session-from-${entityType}s`
          const result = await executeAction({
            identifier: actionIdentifier,
            actionContext: {
              projectName,
              entityType,
              entityIds: filteredEntities.map((e) => e.entityId),
              // Pass the target list ID as list_id in formData
              formData: { list_id: listId },
            },
            addonName: 'review',
            addonVersion: reviewAddonVersion,
          }).unwrap()

          if (result.success) {
            if (result.payload) {
              // invalidate the list caches
              const tags = [
                { type: 'entityList', id: listId },
                { type: 'entityListItem', id: listId },
                { type: 'entityListItemsColumnStats', id: listId },
              ]
              dispatch(entityListsQueriesGql.util.invalidateTags(tags))
            }
            toast.success(`Item${filteredEntities.length > 1 ? 's' : ''} added to session`)
            return Promise.resolve()
          } else {
            throw new Error(result.message || 'Error adding to session')
          }
        } catch (error: any) {
          console.error('Error adding to session via action', error)
          toast.error(error?.data?.detail || error?.message || 'Error adding to session')
          return Promise.reject(error)
        }
      }

      // Default review session logic for versions: only accept versions with reviewables
      if (isReviewSession && entityType === 'version') {
        const eligible = filteredEntities.filter((e) => e.hasReviewables !== false)
        const skippedCount = filteredEntities.length - eligible.length
        if (skippedCount > 0 && eligible.length === 0) {
          toast.error(
            skippedCount === 1
              ? 'Cannot add version without reviewables to review session'
              : `Cannot add ${skippedCount} versions without reviewables to review session`,
          )
          return Promise.reject(new Error('No reviewable versions to add'))
        }
        if (skippedCount > 0) {
          toast.warn(
            skippedCount === 1
              ? '1 version skipped (no reviewables)'
              : `${skippedCount} versions skipped (no reviewables)`,
          )
        }
        filteredEntities = eligible
      }

      if (filteredEntities.length === 0) {
        toast.error('No entities to add')
        return Promise.reject(new Error('No entities to add'))
      }

      const entitiesToAdd = filteredEntities.map((entity) => ({ entityId: entity.entityId }))

      try {
        await updateEntityListItems({
          listId,
          projectName,
          entityListMultiPatchModel: {
            items: entitiesToAdd,
            mode: 'merge',
          },
        }).unwrap()

        toast.success(`Item${entitiesToAdd.length > 1 ? 's' : ''} added to list`)

        return Promise.resolve()
      } catch (error: any) {
        console.error('Error adding to list', error)
        toast.error(error || 'Error adding to list')
        return Promise.reject(error)
      }
    },
    [
      projectName,
      allLists.data,
      reviewAddonVersion,
      hasReviewActionsVersion,
      executeAction,
      updateEntityListItems,
    ],
  )

  // Update the state type and initialize as null
  const [newListData, setNewListData] = useState<NewListData | null>(null)

  // Update openCreateNewList to store selected entities
  const openCreateNewList = useCallback(
    (entityType: ListEntityType, selectedEntities: ListEntityInput[], entityListType?: string) =>
      setNewListData({ entityType, selectedEntities, entityListType }),
    [setNewListData],
  )
  const closeCreateNewList = useCallback(() => setNewListData(null), [setNewListData])

  const [createNewListMutation, { error: newListError }] = useCreateEntityListMutation()
  // @ts-expect-error - we just know the error is an object
  const newListErrorMessage = newListError?.data?.detail as string
  // Update createNewList to use entities from newListData state
  const createNewList: EntityListsContextType['createNewList'] = useCallback(
    async (label) => {
      try {
        // Get entities from newListData state
        if (!newListData) {
          toast.error('No entities selected')
          return Promise.reject(new Error('No entities selected'))
        }

        const { selectedEntities, entityType, entityListType } = newListData

        // filter out entities that do not match entityType
        const filteredEntities = selectedEntities.filter(
          (entity) => entity.entityType === entityType,
        )

        const entitiesToAdd = filteredEntities.map((entity) => ({ entityId: entity.entityId }))

        let listId: string | undefined

        // For review sessions from folders or tasks, use the specialized action
        if (
          entityListType === 'review-session' &&
          (entityType === 'folder' || entityType === 'task')
        ) {
          if (!reviewAddonVersion) {
            toast.error('Review addon not available')
            return Promise.reject(new Error('Review addon not available'))
          }

          if (!hasReviewActionsVersion) {
            toast.error(
              `Please upgrade Review addon to at least ${MIN_REVIEW_ACTIONS_VERSION} to use this feature with folders and tasks`,
            )
            return Promise.reject(new Error('Review addon version too low'))
          }

          const actionIdentifier = `review-save-session-from-${entityType}`
          const result = await executeAction({
            identifier: actionIdentifier,
            actionContext: {
              projectName,
              entityType,
              entityIds: entitiesToAdd.map((e) => e.entityId),
              // Passing label to the action as it might be required for naming the session
              formData: { label },
            },
            addonName: 'review',
            addonVersion: reviewAddonVersion,
          }).unwrap()

          if (!result.success) {
            throw new Error(result.message || 'Error creating review session from action')
          }

          const payloadData = (result.payload as any)?.data
          // Try to extract created ID if provided, though standard behavior might vary
          listId = payloadData?.id

          if (payloadData) {
            // invalidate the list caches
            const tags = [
              { type: 'entityList', id: listId },
              { type: 'entityListItemsColumnStats', id: listId },
            ]
            dispatch(entityListsQueriesGql.util.invalidateTags(tags))
          }

          toast.success(`Review session ${label} created`)
        } else {
          // Default: create via entity list mutation (used for versions and generic lists)
          const newListResult = await createNewListMutation({
            projectName,
            entityListPostModel: {
              label,
              entityType,
              entityListType,
              items: entitiesToAdd,
            },
          }).unwrap()

          listId = newListResult.id

          toast.success(`List ${label} created`)
          toast.success(
            `${upperFirst(entityType)}${entitiesToAdd.length > 1 ? 's' : ''} added to list`,
          )
        }

        // close the dialog
        closeCreateNewList()

        // add list id to search params
        if (listId) {
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev)
            newParams.set('list', listId)
            return newParams
          })
        }
      } catch (error: any) {
        console.error('Error creating list', error)
        toast.error(error?.data?.detail || error?.message || 'Error creating list')
        return Promise.reject(error)
      }
    },
    [
      projectName,
      closeCreateNewList,
      newListData,
      setSearchParams,
      createNewListMutation,
      executeAction,
      reviewAddonVersion,
      hasReviewActionsVersion,
    ],
  )

  const newListMenuItem = useCallback<EntityListsContextType['newListMenuItem']>(
    (entityType, selected) => ({
      id: '__new-list__',
      label: 'New list',
      icon: 'add',
      command: () => openCreateNewList(entityType, selected),
    }),
    [openCreateNewList],
  )

  const getListIcon = (entityType: string, entityListType: string) => {
    if (entityListType === 'review-session') {
      return 'subscriptions'
    } else {
      return getEntityTypeIcon(entityType)
    }
  }

  const buildListMenuItem: EntityListsContextType['buildListMenuItem'] = useCallback(
    (list, selected, showIcon?, disabled?, overrideEntityType?) => ({
      id: list.id,
      label: list.label,
      icon: showIcon ? getListIcon(list.entityType, list.entityListType) : undefined,
      disabled,
      command: disabled
        ? undefined
        : () =>
            addToList(
              list.id,
              overrideEntityType || list.entityType,
              selected.map((i) => ({
                entityId: i.entityId,
                entityType: i.entityType,
                hasReviewables: i.hasReviewables,
              })),
            ),
    }),
    [addToList],
  )

  const buildAddToListMenu: EntityListsContextType['buildAddToListMenu'] = useCallback(
    (items, menu) => {
      return {
        id: 'add-to-list',
        label: menu?.label || 'Add to list',
        icon: 'list_alt_add',
        items: items,
      }
    },
    [],
  )

  // Build a hierarchical structure of folders -> lists (lists only actionable)
  const buildHierarchicalMenuItems = useCallback(
    (
      lists: EntityList[],
      selected: ListEntityInput[],
      getShowIcon?: (list: EntityList) => boolean,
      getDisabled?: (list: EntityList) => boolean,
      overrideEntityType?: string,
    ): ListSubMenuItem[] => {
      // Simple cache keyed by folder+list ids + selection length + powerLicense flag
      // This prevents rebuilding identical structures across repeated context menu openings.
      // (Selection identities beyond length don't affect structure of destination list tree).
      type CacheValue = {
        items: ListSubMenuItem[]
        selectedRef: ListEntityInput[]
      }
      const staticCache = (buildHierarchicalMenuItems as any)._cache as
        | Map<string, CacheValue>
        | undefined
      const cache: Map<string, CacheValue> = staticCache || new Map()
      if (!(buildHierarchicalMenuItems as any)._cache) {
        ;(buildHierarchicalMenuItems as any)._cache = cache
      }

      // When getDisabled is supplied, results depend on per-call selection state — skip cache
      const useCache = !getDisabled && !overrideEntityType
      const folderSig = powerLicense
        ? listFolders.map((f) => `${f.id}:${f.parentId || ''}:${f.label}`).join('|')
        : 'nofolders'
      const listSig = lists.map((l) => `${l.id}:${l.entityListFolderId || ''}`).join('|')
      const key = `${folderSig}::${listSig}::${selected.length}::${powerLicense}`

      const cached = useCache ? cache.get(key) : undefined
      if (cached) {
        // Recreate command closures with current selection (list items carry command depending on selected)
        const rebindCommands = (items: ListSubMenuItem[]): ListSubMenuItem[] => {
          return items.map((item) => {
            // Skip special items like '__new-list__' which should not be in the cache
            if (item.id.startsWith('__')) {
              return item
            }
            // If this is a list item (has command), rebind it with current selection
            if (item.command) {
              const list = lists.find((l) => l.id === item.id)
              if (list) {
                return buildListMenuItem(
                  list,
                  selected,
                  item.icon !== undefined,
                  false,
                  overrideEntityType,
                )
              }
            }
            // If this is a folder (has nested items), recursively rebind children
            if (item.items) {
              return {
                ...item,
                items: rebindCommands(item.items),
              }
            }
            return item
          })
        }
        // Filter out any special items that shouldn't be in cache (like __new-list__)
        const filteredItems = cached.items.filter((item) => !item.id.startsWith('__'))
        return rebindCommands(filteredItems)
      }

      const resolveShowIcon = getShowIcon || (() => false)
      const resolveDisabled = getDisabled || (() => false)

      // Filter lists to only include those with editor access (accessLevel >= 20)
      const editableLists = lists.filter((list) => (list.accessLevel ?? 0) >= 20)

      if (!powerLicense || !listFolders.length) {
        return editableLists.map((l) =>
          buildListMenuItem(
            l,
            selected,
            resolveShowIcon(l),
            resolveDisabled(l),
            overrideEntityType,
          ),
        )
      }

      // folder node structure
      interface FolderNode {
        folder: EntityListFolderModel
        children: FolderNode[]
        lists: EntityList[]
      }
      const nodeMap = new Map<string, FolderNode>()

      // init nodes
      listFolders.forEach((f) => {
        nodeMap.set(f.id, { folder: f, children: [], lists: [] })
      })

      // link children
      listFolders.forEach((f) => {
        if (f.parentId && nodeMap.has(f.parentId)) {
          nodeMap.get(f.parentId)!.children.push(nodeMap.get(f.id)!)
        }
      })

      // assign lists (only editable ones)
      editableLists.forEach((list) => {
        if (list.entityListFolderId && nodeMap.has(list.entityListFolderId)) {
          nodeMap.get(list.entityListFolderId)!.lists.push(list)
        }
      })

      // determine which folders (and ancestors) actually contain lists
      const folderHasListCache = new Map<string, boolean>()
      const hasAnyLists = (folderId: string): boolean => {
        if (folderHasListCache.has(folderId)) return folderHasListCache.get(folderId)!
        const node = nodeMap.get(folderId)
        if (!node) return false
        const value =
          node.lists.length > 0 || node.children.some((child) => hasAnyLists(child.folder.id))
        folderHasListCache.set(folderId, value)
        return value
      }

      const buildFolderItems = (nodes: FolderNode[]): ListSubMenuItem[] => {
        return nodes
          .filter((n) => hasAnyLists(n.folder.id))
          .map((n) => {
            const childFolders = buildFolderItems(n.children)
            const listItems = n.lists.map((l) =>
              buildListMenuItem(
                l,
                selected,
                resolveShowIcon(l),
                resolveDisabled(l),
                overrideEntityType,
              ),
            )
            return {
              id: `folder-${n.folder.id}`,
              label: n.folder.label,
              icon: n.folder.data?.icon || 'snippet_folder',
              // Folders themselves are not actionable, only their items
              items: [...childFolders, ...listItems],
            }
          })
      }

      // root folders (no parentId)
      const rootNodes = listFolders
        .filter((f) => !f.parentId)
        .map((f) => nodeMap.get(f.id)!)
        .filter(Boolean)

      const folderItems = buildFolderItems(rootNodes)

      // lists without a folder (root lists)
      const rootLists = editableLists.filter((l) => !l.entityListFolderId)
      const rootListItems = rootLists.map((l) =>
        buildListMenuItem(l, selected, resolveShowIcon(l), resolveDisabled(l), overrideEntityType),
      )

      const result = [...folderItems, ...rootListItems]
      if (useCache) cache.set(key, { items: result, selectedRef: selected })
      return result
    },
    [buildListMenuItem, listFolders, powerLicense],
  )

  const buildReviewContextMenu: EntityListsContextType['buildReviewContextMenu'] = useCallback(
    (entityType, entities, label, filter) => {
      const hasAnyNonReviewable =
        entityType === 'version' ? entities.some((v) => v.hasReviewables === false) : false

      let targetLists = versions
      if (entityType === 'folder') targetLists = folders
      else if (entityType === 'task') targetLists = tasks

      let subMenuItems = buildHierarchicalMenuItems(
        targetLists,
        entities,
        () => false,
        () => false,
      )
      const reviewSubMenuItems = buildHierarchicalMenuItems(
        reviews,
        entities,
        () => true,
        undefined,
        entityType,
      )

      if (filter && typeof filter === 'function') {
        subMenuItems = subMenuItems.filter(filter)
      }

      const OPEN_REVIEW_SESSION_ACTION_ID_BASE = 'review-create-session-from'
      const openReviewSession = async () => {
        if (!reviewAddonVersion) return toast.error('Review addon not available')

        if ((entityType === 'folder' || entityType === 'task') && !hasReviewActionsVersion) {
          toast.error(
            `Please upgrade Review addon to at least ${MIN_REVIEW_ACTIONS_VERSION} to use this feature with folders and tasks`,
          )
          return
        }

        const loadingToast = toast.loading('Opening review session...')
        try {
          const result = await executeAction({
            identifier: `${OPEN_REVIEW_SESSION_ACTION_ID_BASE}-${entityType}s`,
            actionContext: {
              projectName,
              entityType,
              entityIds: entities.map((v) => v.entityId),
            },
            addonName: 'review',
            addonVersion: reviewAddonVersion,
          }).unwrap()
          const payload = result.payload as { uri?: string; new_tab?: boolean } | undefined
          if (result.success && result?.type === 'redirect' && payload?.uri) {
            toast.update(loadingToast, {
              render: 'Review session created, redirecting...',
              type: 'success',
              isLoading: false,
              autoClose: 3000,
            })
            window.open(payload.uri, '_blank')
          } else {
            toast.update(loadingToast, {
              render: 'Unexpected response from review addon',
              type: 'error',
              isLoading: false,
              autoClose: 5000,
            })
          }
        } catch (error) {
          console.error('Error creating review session', error)
          toast.update(loadingToast, {
            render: 'Error creating review session',
            type: 'error',
            isLoading: false,
            autoClose: 5000,
          })
        }
      }

      subMenuItems.push(newListMenuItem(entityType, entities))

      const menu: any[] = [buildAddToListMenu(subMenuItems, { label })]

      if (hasReviewAddon) {
        // Build review menu items and add a disabled note if any selected version lacks reviewables
        const reviewItems: ListSubMenuItem[] = [
          {
            id: 'open-session',
            label: 'Open in review',
            icon: 'subscriptions',
            command: () => openReviewSession(),
          },
          {
            id: 'create-session',
            label: 'Create new session',
            icon: 'add',
            command: () => {
              if ((entityType === 'folder' || entityType === 'task') && !hasReviewActionsVersion) {
                toast.error(
                  `Please upgrade Review addon to at least ${MIN_REVIEW_ACTIONS_VERSION} to use this feature with folders and tasks`,
                )
                return
              }
              openCreateNewList(entityType, entities, 'review-session')
            },
          },
          {
            id: 'add-to-session',
            label: 'Add to session',
            icon: 'list_alt_add',
            items: reviewSubMenuItems,
            disabled: reviewSubMenuItems.length === 0,
          },
        ]

        const disabledLabel =
          entityType === 'version' ? ' (all versions need reviewable)' : ' (need reviewable)'
        const getLabel = (base: string) => (hasAnyNonReviewable ? base + disabledLabel : base)

        menu.push({
          id: 'review',
          label: getLabel('Review'),
          icon: 'subscriptions',
          items: hasAnyNonReviewable ? [] : reviewItems,
          disabled: hasAnyNonReviewable,
        })
      }

      return menu
    },
    [
      folders,
      tasks,
      buildHierarchicalMenuItems,
      buildAddToListMenu,
      newListMenuItem,
      versions,
      reviews,
      hasReviewAddon,
      hasReviewActionsVersion,
      executeAction,
      projectName,
      reviewAddonVersion,
      openCreateNewList,
    ],
  )

  const menuItems: EntityListsContextType['menuItems'] = useCallback(
    (filter) => (_e, cell, selected, _meta) => {
      const isMultipleEntityTypes = selected.some(
        (item) => item.entityType !== selected[0].entityType,
      )

      if (cell.isGroup) return []

      // helpers to decide icon visibility
      const getShowIconMultiple = () => isMultipleEntityTypes

      let subMenuItems: ListSubMenuItem[] = []

      if (isMultipleEntityTypes) {
        const combined = [...folders, ...tasks]
        subMenuItems = buildHierarchicalMenuItems(combined, selected, () => getShowIconMultiple())
      } else if (cell.entityType === 'folder') {
        return buildReviewContextMenu('folder', selected, undefined, filter)
      } else if (cell.entityType === 'task') {
        return buildReviewContextMenu('task', selected, undefined, filter)
      } else if (cell.entityType === 'product') {
        // if the product has a featured version, only allow adding that version to lists
        // @ts-expect-error- just don't worry about it
        if (cell.data?.featuredVersion?.id) {
          // @ts-expect-error - featuredVersion is not supported in typings
          const versionEntity = { entityId: cell.data.featuredVersion.id, entityType: 'version' }
          // Pass down the filter here too
          return buildReviewContextMenu('version', [versionEntity], undefined, filter)
        } else {
          subMenuItems = buildHierarchicalMenuItems(products, selected, () => getShowIconMultiple())
        }
      } else if (cell.entityType === 'version') {
        // Cells expose hasReviewables on .data — propagate so addToList + UI gating can consume it
        const selectedWithReviewable: ListEntityInput[] = selected.map((s) => ({
          entityId: s.entityId,
          entityType: s.entityType,
          hasReviewables: (s.data as any)?.hasReviewables,
        }))
        return buildReviewContextMenu('version', selectedWithReviewable, undefined, filter)
      }

      // Apply filter if provided
      if (filter && typeof filter === 'function') {
        subMenuItems = subMenuItems.filter(filter)
      }

      // Add new list item at end
      // @ts-expect-error - product is not supported in typings
      if (cell.entityType && listEntityTypes.includes(cell.entityType)) {
        subMenuItems.push(newListMenuItem(cell.entityType as ListEntityType, selected))
      }

      // @ts-expect-error - featuredVersion is not supported in typings
      const listLabel = cell.data?.featuredVersion?.id
        ? // @ts-expect-error - featuredVersion is not supported in typings
          `Add to list (${cell.data.featuredVersion.name})`
        : undefined

      return [buildAddToListMenu(subMenuItems, { label: listLabel })]
    },
    [
      folders,
      tasks,
      products,
      versions,
      buildHierarchicalMenuItems,
      newListMenuItem,
      buildAddToListMenu,
      buildReviewContextMenu,
    ],
  )

  const value = useMemo(
    () => ({
      allLists,
      folders,
      tasks,
      products,
      versions,
      reviews,
      addToList,
      menuItems,
      buildListMenuItem,
      buildAddToListMenu,
      newListMenuItem,
      newListData,
      openCreateNewList,
      closeCreateNewList,
      createNewList,
      newListErrorMessage,
      buildHierarchicalMenuItems,
      buildReviewContextMenu,
    }),
    [
      allLists,
      folders,
      tasks,
      products,
      versions,
      reviews,
      addToList,
      menuItems,
      buildListMenuItem,
      buildAddToListMenu,
      newListMenuItem,
      newListData,
      openCreateNewList,
      closeCreateNewList,
      createNewList,
      newListErrorMessage,
      buildHierarchicalMenuItems,
      buildReviewContextMenu,
    ],
  )

  return <EntityListsContext.Provider value={value}>{children}</EntityListsContext.Provider>
}

export const useEntityListsContext = () => {
  const context = useContext(EntityListsContext)
  if (context === undefined) {
    throw new Error('useEntityListsContext must be used within an EntityListsProvider')
  }
  return context
}

export const useOptionalEntityListsContext = () => useContext(EntityListsContext)

export default EntityListsContext
