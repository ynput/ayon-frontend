import { useCallback } from 'react'
import { ListEntityType } from '../components/NewListDialog/NewListDialog'
import { ContextMenuItemConstructor } from '@shared/containers/ProjectTreeTable/hooks/useCellContextMenu'
import { EntityList } from '@shared/api'
import { toast } from 'react-toastify'

const MIN_REVIEW_ACTIONS_VERSION = '0.5.0'

export type ListSubMenuItem = {
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

interface UseBuildListMenuItemsProps {
  projectName: string
  hasReviewAddon: boolean
  hasReviewActionsVersion: boolean
  reviewAddonVersion?: string
  openCreateNewList: (
    entityType: ListEntityType,
    selectedEntities: ListEntityInput[],
    entityListType?: string,
  ) => void
  openAddToListDialog: (
    entityType: string,
    entities: ListEntityInput[],
    opts?: { isReview?: boolean; listFilter?: (list: EntityList) => boolean },
  ) => void
  executeAction: any
}

export const useBuildListMenuItems = ({
  projectName,
  hasReviewAddon,
  hasReviewActionsVersion,
  reviewAddonVersion,
  openCreateNewList,
  openAddToListDialog,
  executeAction,
}: UseBuildListMenuItemsProps) => {
  // Direct "Add to list" action that opens the add-to-list dialog instead of a nested submenu
  const buildAddToListItem = useCallback(
    (
      entityType: string,
      entities: ListEntityInput[],
      label?: string,
      filter?: (item: ListSubMenuItem) => boolean,
    ): ListSubMenuItem => ({
      id: 'add-to-list',
      label: label || 'Add to list',
      icon: 'list_alt_add',
      command: () =>
        openAddToListDialog(entityType, entities, {
          listFilter: filter ? (list) => filter({ id: list.id, label: list.label }) : undefined,
        }),
    }),
    [openAddToListDialog],
  )

  const buildReviewContextMenu = useCallback(
    (
      entityType: ListEntityType,
      entities: ListEntityInput[],
      label?: string,
      filter?: (item: ListSubMenuItem) => boolean,
    ) => {
      const hasAnyNonReviewable =
        entityType === 'version' ? entities.some((v) => v.hasReviewables === false) : false

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

      const menu: any[] = [buildAddToListItem(entityType, entities, label, filter)]

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
            label: 'Add to review list',
            icon: 'list_alt_add',
            command: () => openAddToListDialog(entityType, entities, { isReview: true }),
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
      buildAddToListItem,
      openAddToListDialog,
      hasReviewAddon,
      hasReviewActionsVersion,
      executeAction,
      projectName,
      reviewAddonVersion,
      openCreateNewList,
    ],
  )

  const menuItems = useCallback(
    (filter?: (item: ListSubMenuItem) => boolean): ContextMenuItemConstructor =>
      (_e, cell, selected, _meta) => {
        if (cell.isGroup) return []

        const isMultipleEntityTypes = selected.some(
          (item) => item.entityType !== selected[0].entityType,
        )

        if (isMultipleEntityTypes) {
          return [buildAddToListItem(selected[0].entityType as string, selected, undefined, filter)]
        } else if (cell.entityType === 'folder') {
          return buildReviewContextMenu('folder', selected, undefined, filter)
        } else if (cell.entityType === 'task') {
          return buildReviewContextMenu('task', selected, undefined, filter)
        } else if (cell.entityType === 'product') {
          // if the product has a featured version, only allow adding that version to lists
          // @ts-expect-error - featuredVersion is not supported in typings
          if (cell.data?.featuredVersion?.id) {
            // @ts-expect-error - featuredVersion is not supported in typings
            const versionEntity = { entityId: cell.data.featuredVersion.id, entityType: 'version' }
            // @ts-expect-error - featuredVersion is not supported in typings
            const label = `Add to list (${cell.data.featuredVersion.name})`
            return buildReviewContextMenu('version', [versionEntity], label, filter)
          }
          // a product with no featured version can't be added: products aren't a valid list type
          return [{ id: 'add-to-list', label: 'Add to list', icon: 'list_alt_add', disabled: true }]
        } else if (cell.entityType === 'version') {
          // Cells expose hasReviewables on .data — propagate so addToList + UI gating can consume it
          const selectedWithReviewable: ListEntityInput[] = selected.map((s) => ({
            entityId: s.entityId,
            entityType: s.entityType,
            hasReviewables: (s.data as any)?.hasReviewables,
          }))
          return buildReviewContextMenu('version', selectedWithReviewable, undefined, filter)
        }

        return []
      },
    [buildAddToListItem, buildReviewContextMenu],
  )

  return {
    buildReviewContextMenu,
    menuItems,
  }
}
